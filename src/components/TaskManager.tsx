import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Plus, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { addXP } from "./XPBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAchievementTracker } from "@/hooks/useAchievementTracker";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  time_hours?: number;
  time_minutes?: number;
  time_seconds?: number;
  timer_started_at?: string;
}

interface TaskManagerProps {
  onTaskComplete?: () => void;
}

const TaskManager = ({ onTaskComplete }: TaskManagerProps) => {
  const { user } = useAuth();
  const { trackTaskCompletion } = useAchievementTracker();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [timeHours, setTimeHours] = useState(0);
  const [timeMinutes, setTimeMinutes] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [showTimeInput, setShowTimeInput] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchTasks = async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setTasks(data.map(task => ({
          id: task.id,
          text: task.text,
          completed: task.completed || false,
          time_hours: task.time_hours || 0,
          time_minutes: task.time_minutes || 0,
          time_seconds: task.time_seconds || 0,
          timer_started_at: task.timer_started_at || undefined,
        })));
      }
    };

    fetchTasks();

    // Subscribe to task changes
    const channel = supabase
      .channel("task_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addTask = async () => {
    if (!user || !newTaskText.trim()) {
      toast.error("Task cannot be empty!");
      return;
    }

    const totalTime = timeHours + timeMinutes + timeSeconds;
    if (totalTime === 0) {
      toast.error("Please set a time for the task!");
      return;
    }
    const hasTime = totalTime > 0;

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: newTaskText.trim(),
      completed: false,
      time_hours: timeHours,
      time_minutes: timeMinutes,
      time_seconds: timeSeconds,
      timer_started_at: hasTime ? new Date().toISOString() : undefined,
    };

    // Optimistic update
    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText("");
    setTimeHours(0);
    setTimeMinutes(0);
    setTimeSeconds(0);
    setShowTimeInput(false);

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      text: newTask.text,
      completed: false,
      time_hours: timeHours,
      time_minutes: timeMinutes,
      time_seconds: timeSeconds,
      timer_started_at: hasTime ? new Date().toISOString() : null,
    });

    if (!error) {
      toast.success("Task added!");
    } else {
      toast.error("Failed to add task");
      // Revert optimistic update on error
      setTasks(prevTasks => prevTasks.filter(t => t.id !== newTask.id));
    }
  };

  const toggleTask = async (id: string) => {
    if (!user) return;

    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Check if task has time constraint
    if (task.timer_started_at && !task.completed) {
      const startTime = new Date(task.timer_started_at).getTime();
      const now = Date.now();
      const elapsed = (now - startTime) / 1000; // seconds
      const required = (task.time_hours || 0) * 3600 + (task.time_minutes || 0) * 60 + (task.time_seconds || 0);
      
      if (elapsed < required) {
        const remaining = required - elapsed;
        const hrs = Math.floor(remaining / 3600);
        const mins = Math.floor((remaining % 3600) / 60);
        const secs = Math.floor(remaining % 60);
        toast.error(`Please wait ${hrs}h ${mins}m ${secs}s before completing this task!`);
        return;
      }
    }

    const newCompleted = !task.completed;

    // Optimistic update to prevent XP glitch
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === id ? { ...t, completed: newCompleted } : t
      )
    );

    const { error } = await supabase
      .from("tasks")
      .update({ completed: newCompleted })
      .eq("id", id);

    if (!error && newCompleted) {
      const xpGained = await addXP(5);
      if (xpGained > 0) {
        toast.success("+5 XP earned!");
        trackTaskCompletion();
        onTaskComplete?.();
      }
    } else if (error) {
      toast.error("Failed to update task");
      // Revert optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === id ? { ...t, completed: !newCompleted } : t
        )
      );
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (!error) {
      toast.success("Task deleted!");
    } else {
      toast.error("Failed to delete task");
    }
  };

  const clearCompleted = async () => {
    if (!user) return;

    const completedTasks = tasks.filter((t) => t.completed);
    const ids = completedTasks.map((t) => t.id);

    if (ids.length === 0) return;

    const { error } = await supabase.from("tasks").delete().in("id", ids);

    if (!error) {
      toast.success("Completed tasks cleared!");
    } else {
      toast.error("Failed to clear tasks");
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <Card className="glass-card p-6 rounded-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <ListChecks className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Daily Tasks</h3>
            <p className="text-sm text-muted-foreground">
              {completedCount} / {tasks.length} completed
            </p>
          </div>
        </div>
        {completedCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear completed
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTask()}
            className="glass-card border-border/50 flex-1"
          />
          <Button
            onClick={() => setShowTimeInput(!showTimeInput)}
            variant="outline"
            size="icon"
            title="Add time constraint"
          >
            ⏱️
          </Button>
          <Button
            onClick={addTask}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
        
        {showTimeInput && (
          <div className="flex gap-2 items-center glass-card p-3 rounded-xl">
            <span className="text-sm text-muted-foreground">Time:</span>
            <Input
              type="number"
              min="0"
              placeholder="H"
              value={timeHours || ""}
              onChange={(e) => setTimeHours(Number(e.target.value))}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">h</span>
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="M"
              value={timeMinutes || ""}
              onChange={(e) => setTimeMinutes(Number(e.target.value))}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">m</span>
            <Input
              type="number"
              min="0"
              max="59"
              placeholder="S"
              value={timeSeconds || ""}
              onChange={(e) => setTimeSeconds(Number(e.target.value))}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">s</span>
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No tasks yet. Add one to get started!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="glass-card p-4 rounded-xl flex items-center gap-3 group hover:scale-[1.02] transition-all duration-200"
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="flex-shrink-0 transition-colors"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground hover:text-primary" />
                )}
              </button>
              <span
                className={`flex-1 ${
                  task.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {task.text}
              </span>
              {task.completed && (
                <span className="text-xs font-semibold text-primary">+5 XP</span>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default TaskManager;

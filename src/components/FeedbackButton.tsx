import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAchievementTracker } from "@/hooks/useAchievementTracker";

const FeedbackButton = () => {
  const { user } = useAuth();
  const { trackFeedbackSubmitted } = useAchievementTracker();
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !feedback.trim()) {
      toast.error("Please write your feedback!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: feedback.trim(),
    });

    setLoading(false);

    if (!error) {
      toast.success("Feedback sent! Thank you!");
      trackFeedbackSubmitted();
      setFeedback("");
      setOpen(false);
    } else {
      toast.error("Failed to send feedback");
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 rounded-full shadow-lg"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts, suggestions, or report issues..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={5}
          />
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackButton;

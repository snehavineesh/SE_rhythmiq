import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Music, Home, ShoppingBag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MerchItem {
  id: string;
  name: string;
  description: string;
  xpCost: number;
  image: string;
  purchased: boolean;
}

const Shop = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [xp, setXp] = useState(0);
  const [merchItems, setMerchItems] = useState<MerchItem[]>([
    {
      id: "sticker-pack",
      name: "Rhythmiq Sticker Pack",
      description: "5 premium vinyl stickers with gradient designs",
      xpCost: 500,
      image: "🎨",
      purchased: false,
    },
    {
      id: "tshirt",
      name: "Focus Mode T-Shirt",
      description: "Premium cotton tee with glow-in-dark logo",
      xpCost: 1500,
      image: "👕",
      purchased: false,
    },
    {
      id: "hoodie",
      name: "Flow State Hoodie",
      description: "Ultra-soft hoodie perfect for study sessions",
      xpCost: 2500,
      image: "🧥",
      purchased: false,
    },
    {
      id: "notebook",
      name: "Productivity Journal",
      description: "120-page guided journal with focus templates",
      xpCost: 800,
      image: "📓",
      purchased: false,
    },
    {
      id: "mug",
      name: "Focus Fuel Mug",
      description: "Ceramic mug with motivational gradient design",
      xpCost: 600,
      image: "☕",
      purchased: false,
    },
    {
      id: "poster",
      name: "Motivation Poster Set",
      description: "3 minimalist posters for your study space",
      xpCost: 1000,
      image: "🖼️",
      purchased: false,
    },
  ]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Load XP
      const { data: xpData } = await supabase
        .from("user_xp")
        .select("xp")
        .eq("user_id", user.id)
        .single();

      if (xpData) {
        setXp(xpData.xp);
      }

      // Load purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("item_id")
        .eq("user_id", user.id);

      if (purchases) {
        const purchasedIds = purchases.map((p) => p.item_id);
        setMerchItems((prevItems) =>
          prevItems.map((item) => ({
            ...item,
            purchased: purchasedIds.includes(item.id),
          }))
        );
      }
    };

    fetchData();

    // Subscribe to XP changes
    const xpChannel = supabase
      .channel("shop_xp_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_xp",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setXp(payload.new.xp);
          }
        }
      )
      .subscribe();

    // Subscribe to purchase changes
    const purchaseChannel = supabase
      .channel("purchase_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "purchases",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
      supabase.removeChannel(purchaseChannel);
    };
  }, [user]);

  const handlePurchase = async (item: MerchItem) => {
    if (!user) return;

    if (item.purchased) {
      toast.info("You've already redeemed this item!");
      return;
    }

    if (xp < item.xpCost) {
      toast.error("Not enough XP!");
      return;
    }

    const { data, error } = await supabase.rpc("purchase_item", {
      item_id_param: item.id,
      xp_cost: item.xpCost,
    });

    if (error) {
      toast.error("Failed to complete purchase");
      return;
    }

    const result = data as { success: boolean; message: string };

    if (result.success) {
      toast.success(`${item.name} redeemed! Check your email for details.`);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Rhythmiq Shop</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 rounded-xl">
              <p className="text-sm text-muted-foreground">Your XP</p>
              <p className="text-xl font-bold gradient-text">{xp}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <div className="space-y-8">
          <div className="space-y-2 animate-fade-in">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Redeem Your XP</h2>
            </div>
            <p className="text-muted-foreground">
              Turn your focus sessions into real rewards. All merch ships worldwide!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchItems.map((item, index) => (
              <Card
                key={item.id}
                className="glass-card p-6 space-y-4 animate-fade-in hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-6xl text-center">{item.image}</div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-2xl font-bold gradient-text">{item.xpCost} XP</div>
                  {item.purchased ? (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold">Redeemed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(item)}
                      disabled={xp < item.xpCost}
                      className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                    >
                      Redeem
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shop;

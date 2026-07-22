import { useState } from "react";
import { Send, Plus, Check, X, Camera, MessageSquare, Loader2 } from "lucide-react";
import type { MealSession } from "@/lib/meal-session";
import { totals } from "@/lib/meal-session";

interface Props {
  session: MealSession;
  busy?: boolean;
  onAnswer: (text: string) => void;
  onAcceptDraft: () => void;
  onDiscardDraft: () => void;
  onRemoveItem: (id: string) => void;
  onAddMorePhoto: () => void;
  onAddMoreDescribe: () => void;
  onDone: () => void;
  onCancel: () => void;
}

const MealChat = ({
  session,
  busy,
  onAnswer,
  onAcceptDraft,
  onDiscardDraft,
  onRemoveItem,
  onAddMorePhoto,
  onAddMoreDescribe,
  onDone,
  onCancel,
}: Props) => {
  const [input, setInput] = useState("");
  const t = totals(session.items);
  const hasPending = session.pendingQuestions.length > 0;
  const hasDraft = !!session.draft;

  const submit = () => {
    const v = input.trim();
    if (!v) return;
    setInput("");
    onAnswer(v);
  };

  return (
    <div className="card-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Meal in progress</p>
          <p className="text-[11px] text-muted-foreground">
            {session.items.length} item{session.items.length === 1 ? "" : "s"} · {Math.round(t.calories)} kcal · P {Math.round(t.protein)}g · C {Math.round(t.carbs)}g · F {Math.round(t.fat)}g
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          Cancel
        </button>
      </div>

      {/* Items so far */}
      {session.items.length > 0 && (
        <ul className="space-y-1.5">
          {session.items.map((it) => (
            <li
              key={it.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-secondary border border-border text-xs"
            >
              <span className="text-foreground truncate">
                <span className="font-medium">{it.name}</span>{" "}
                <span className="text-muted-foreground">
                  · {Math.round(it.calories)} kcal
                </span>
              </span>
              <button
                onClick={() => onRemoveItem(it.id)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Remove item"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Chat log */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {session.messages.map((m) => (
          <div
            key={m.id}
            className={`text-xs ${m.role === "ai" ? "text-foreground" : "text-primary text-right"}`}
          >
            <div
              className={`inline-block px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                m.role === "ai"
                  ? m.kind === "error"
                    ? "bg-destructive/10 border border-destructive/30 text-destructive"
                    : "bg-secondary border border-border"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {m.text}
            </div>
            {m.role === "ai" && m.chips && m.chips.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.chips.map((c) => (
                  <button
                    key={c}
                    onClick={() => onAnswer(c)}
                    disabled={busy}
                    className="px-2.5 py-1 rounded-full border border-primary/40 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Thinking…
          </div>
        )}
      </div>

      {/* Draft confirm bar */}
      {hasDraft && !hasPending && !busy && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-2.5 space-y-2">
          <p className="text-xs text-foreground">
            Add <span className="font-semibold">{session.draft!.name}</span> ({Math.round(session.draft!.calories)} kcal) to this meal?
          </p>
          <div className="flex gap-2">
            <button
              onClick={onAcceptDraft}
              className="flex-1 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
            >
              <Check size={12} className="inline mr-1" /> Add to meal
            </button>
            <button
              onClick={onDiscardDraft}
              className="px-3 py-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:border-muted-foreground"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Answer input (visible when pending question) */}
      {(hasPending || hasDraft) && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={hasPending ? "Type your answer…" : "Add a note / correction…"}
            disabled={busy}
            className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={busy || !input.trim()}
            className="px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            aria-label="Send"
          >
            <Send size={14} />
          </button>
        </div>
      )}

      {/* Add more + Done actions (visible when idle) */}
      {!hasPending && !hasDraft && session.items.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground">Is this the whole meal, or adding more?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAddMorePhoto}
              disabled={busy}
              className="py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Camera size={14} /> Add photo
            </button>
            <button
              onClick={onAddMoreDescribe}
              disabled={busy}
              className="py-2 rounded-lg border border-border text-xs font-medium text-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <MessageSquare size={14} /> Describe more
            </button>
          </div>
          <button
            onClick={onDone}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            <Check size={14} className="inline mr-1" /> Done, save meal
          </button>
        </div>
      )}
    </div>
  );
};

export default MealChat;
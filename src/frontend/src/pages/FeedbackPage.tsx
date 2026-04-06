import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Loader2, MessageSquare, Send, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { FeedbackForUser } from "../backend.d";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useSubmitFeedback,
  useUserFeedbackWithReplies,
} from "../hooks/useQueries";

function FeedbackStatusBadge({
  status,
}: {
  status: FeedbackForUser["status"];
}) {
  if ("unread" in status) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: "rgba(245,158,11,0.12)",
          color: "#f59e0b",
          border: "1px solid rgba(245,158,11,0.25)",
        }}
      >
        Unread
      </span>
    );
  }
  if ("resolved" in status) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        Resolved
      </span>
    );
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: "rgba(34,211,238,0.12)",
        color: "#22D3EE",
        border: "1px solid rgba(34,211,238,0.25)",
      }}
    >
      Read
    </span>
  );
}

export default function FeedbackPage() {
  const { t } = useLanguage();
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();
  const { data: history = [], isLoading: loadingHistory } =
    useUserFeedbackWithReplies();
  const [message, setMessage] = useState("");

  // Sort newest first
  const sortedHistory = [...history].sort(
    (a, b) => Number(b.timestamp) - Number(a.timestamp),
  );

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }
    submitFeedback(message, {
      onSuccess: () => {
        toast.success(t.feedbackSuccess);
        setMessage("");
      },
      onError: (e) => toast.error(`${t.error}: ${e.message}`),
    });
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.feedbackTitle}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Your feedback helps improve Dokmai IC
        </p>
      </div>

      {/* Feedback form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-gradient-border p-5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(34,211,238,0.12)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <MessageSquare size={16} style={{ color: "#22D3EE" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
            {t.feedbackTitle}
          </h3>
        </div>

        <Textarea
          data-ocid="feedback.message.textarea"
          placeholder={t.feedbackPlaceholder}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          style={{
            background: "#071427",
            border: "1px solid #1A3354",
            color: "#EAF2FF",
            resize: "none",
          }}
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: "#9BB0C9" }}>
            {message.length} / 1000 characters
          </span>
          <Button
            data-ocid="feedback.submit.primary_button"
            onClick={handleSubmit}
            disabled={isPending || !message.trim()}
            className="rounded-full font-semibold text-sm"
            style={{ background: "#22D3EE", color: "#071427" }}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin mr-1" />
            ) : (
              <Send size={14} className="mr-1" />
            )}
            {t.feedbackSubmit}
          </Button>
        </div>
      </motion.div>

      {/* Feedback history */}
      <div>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: "#9BB0C9" }}>
          {t.feedbackHistory}
        </h3>
        {loadingHistory ? (
          <div
            className="flex items-center gap-2"
            data-ocid="feedback.history.loading_state"
          >
            <Loader2
              className="animate-spin"
              size={16}
              style={{ color: "#22D3EE" }}
            />
            <span className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.loading}
            </span>
          </div>
        ) : sortedHistory.length === 0 ? (
          <div
            className="text-center py-8 rounded-2xl"
            data-ocid="feedback.history.empty_state"
            style={{
              background: "rgba(13,31,58,0.5)",
              border: "1px dashed #1A3354",
            }}
          >
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              No feedback submitted yet
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedHistory.map((fb, i) => (
              <motion.div
                key={fb.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-gradient-border p-4 flex flex-col gap-2"
                data-ocid={`feedback.history.item.${i + 1}`}
              >
                {/* Message row with status badge */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1" style={{ color: "#EAF2FF" }}>
                    {fb.message}
                  </p>
                  <FeedbackStatusBadge status={fb.status} />
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5">
                  <Clock size={11} style={{ color: "#9BB0C9" }} />
                  <span className="text-xs" style={{ color: "#9BB0C9" }}>
                    {new Date(
                      Number(fb.timestamp) / 1_000_000,
                    ).toLocaleDateString()}
                  </span>
                </div>

                {/* Admin reply section */}
                {fb.adminReply !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 rounded-lg px-3 py-2.5 flex flex-col gap-1"
                    style={{
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck size={11} style={{ color: "#22c55e" }} />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#22c55e" }}
                      >
                        Admin Reply
                      </span>
                      {fb.adminReplyTimestamp !== null && (
                        <span
                          className="text-xs ml-auto"
                          style={{ color: "#4a6a8a" }}
                        >
                          {new Date(
                            Number(fb.adminReplyTimestamp) / 1_000_000,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: "#b8e6c8" }}
                    >
                      {fb.adminReply}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

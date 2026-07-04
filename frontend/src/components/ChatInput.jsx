import { SendHorizontal } from "lucide-react";

const ChatInput = ({ value, onChange, onSubmit, disabled }) => (
  <form className="chat-input" onSubmit={onSubmit}>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Type a message..."
      rows={1}
      disabled={disabled}
    />
    <button type="submit" className="icon-button primary" disabled={disabled || !value.trim()} title="Send">
      <SendHorizontal size={19} />
    </button>
  </form>
);

export default ChatInput;

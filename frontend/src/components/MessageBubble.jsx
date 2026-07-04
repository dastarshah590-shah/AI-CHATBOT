import { Bot, Headphones, UserRound } from "lucide-react";

const iconMap = {
  bot: Bot,
  agent: Headphones,
  customer: UserRound
};

const MessageBubble = ({ message }) => {
  const Icon = iconMap[message.senderType] || Bot;
  const isCustomer = message.senderType === "customer";

  return (
    <div className={isCustomer ? "message-row customer" : "message-row"}>
      <div className="message-avatar">
        <Icon size={16} />
      </div>
      <div className="message-bubble">
        <p>{message.message}</p>
        {message.confidence ? <span>{Math.round(message.confidence * 100)}%</span> : null}
      </div>
    </div>
  );
};

export default MessageBubble;

/** "Monster Quest" wordmark. Pure CSS/SVG so it stays crisp and original. */
export function MqLogo({ className = '' }: { className?: string }) {
  return (
    <span className={`mq-logo ${className}`} aria-label="Monster Quest">
      <span className="mq-logo-a">MONSTER</span>
      <span className="mq-logo-b">QUEST</span>
    </span>
  );
}

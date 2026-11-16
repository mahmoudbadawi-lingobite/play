import { ui } from '../uiAssets';

/** The "Monster Quest" logo (painted picture: shield + wordmark). */
export function MqLogo({ className = '' }: { className?: string }) {
  return <img className={`mq-logo-img ${className}`} src={ui('logo')} alt="Monster Quest" draggable={false} />;
}

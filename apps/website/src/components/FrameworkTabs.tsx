import {translate} from '@docusaurus/Translate';
import {useFramework} from './FrameworkProvider';
import type {Framework} from '../lib/frameworkPreference';

const OPTIONS: {id: Framework; label: string}[] = [
  {id: 'react', label: 'React'},
  {id: 'vue', label: 'Vue'},
];

export function FrameworkTabs({className = ''}: {className?: string}) {
  const {framework, setFramework} = useFramework();

  return (
    <div
      className={`fw-tabs ${className}`.trim()}
      role="tablist"
      aria-label={translate({
        id: 'frameworkTabs.ariaLabel',
        message: 'Framework',
      })}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={framework === opt.id}
          className={
            framework === opt.id ? 'fw-tabs__btn is-active' : 'fw-tabs__btn'
          }
          onClick={() => setFramework(opt.id)}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

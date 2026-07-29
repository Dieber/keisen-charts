import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import CodeBlock from '@theme/CodeBlock';
import {useFramework} from './FrameworkProvider';

type FrameworkExampleProps = {
  react: string;
  vue: string;
  reactTitle?: string;
  vueTitle?: string;
};

function FrameworkExampleInner({
  react,
  vue,
  reactTitle = 'App.tsx',
  vueTitle = 'App.vue',
}: FrameworkExampleProps) {
  const {framework} = useFramework();
  const code = framework === 'react' ? react : vue;
  const title = framework === 'react' ? reactTitle : vueTitle;
  const language = framework === 'react' ? 'tsx' : 'vue';

  return (
    <div className="fw-example">
      <CodeBlock language={language} title={title}>
        {code.trim()}
      </CodeBlock>
    </div>
  );
}

/** Static code block that follows the sidebar framework preference */
export function FrameworkExample(props: FrameworkExampleProps) {
  return (
    <BrowserOnly
      fallback={
        <div className="fw-example">
          <div className="sandpack-wrap__status">
            <Translate id="frameworkExample.loading">
              Loading code example…
            </Translate>
          </div>
        </div>
      }>
      {() => <FrameworkExampleInner {...props} />}
    </BrowserOnly>
  );
}

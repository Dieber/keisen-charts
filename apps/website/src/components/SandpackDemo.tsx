import BrowserOnly from '@docusaurus/BrowserOnly';
import Translate from '@docusaurus/Translate';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
} from '@codesandbox/sandpack-react';
import {useFramework} from './FrameworkProvider';
import {sandpackDeps, sandpackTemplate} from '../lib/sandpackConfig';

export type ExampleFiles = {
  react: Record<string, string>;
  vue: Record<string, string>;
};

type SandpackDemoProps = {
  id: string;
  files: ExampleFiles;
  height?: number;
  note?: string;
};

function SandpackDemoInner({
  files,
  height = 420,
  note,
}: Omit<SandpackDemoProps, 'id'>) {
  const {framework} = useFramework();
  const activeFiles = files[framework];
  const template = sandpackTemplate(framework);
  const dependencies = sandpackDeps(framework);
  const visibleFiles = orderVisibleFiles(Object.keys(activeFiles));

  return (
    <div className="sandpack-wrap">
      {note ? <p className="sandpack-wrap__note">{note}</p> : null}
      <SandpackProvider
        key={framework}
        template={template}
        files={activeFiles}
        customSetup={{dependencies: {...dependencies}}}
        theme="light"
        options={{
          autorun: true,
          recompileMode: 'delayed',
          recompileDelay: 400,
          visibleFiles,
          activeFile: visibleFiles[0],
        }}>
        <SandpackLayout>
          <SandpackCodeEditor showTabs showLineNumbers style={{height}} />
          <SandpackPreview style={{height}} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

/** App first, kline second, keep the rest in original order */
function orderVisibleFiles(paths: string[]): string[] {
  const isApp = (p: string) => /(^|\/)App\.(tsx|vue|jsx|js)$/.test(p);
  const isKline = (p: string) => /(^|\/)kline\.ts$/.test(p);
  const app = paths.filter(isApp);
  const kline = paths.filter(isKline);
  const rest = paths.filter((p) => !isApp(p) && !isKline(p));
  return [...app, ...kline, ...rest];
}

export function SandpackDemo(props: SandpackDemoProps) {
  return (
    <BrowserOnly
      fallback={
        <div className="sandpack-wrap">
          <p className="sandpack-wrap__status">
            <Translate id="sandpack.loadingExample">
              Loading interactive example…
            </Translate>
          </p>
        </div>
      }>
      {() => <SandpackDemoInner {...props} />}
    </BrowserOnly>
  );
}

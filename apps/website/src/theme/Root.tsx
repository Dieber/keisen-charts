import type {ReactNode} from 'react';
import {FrameworkProvider} from '@site/src/components/FrameworkProvider';

export default function Root({children}: {children: ReactNode}): ReactNode {
  return <FrameworkProvider>{children}</FrameworkProvider>;
}

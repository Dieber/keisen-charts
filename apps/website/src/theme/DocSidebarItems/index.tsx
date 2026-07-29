import React, {type ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import DocSidebarItems from '@theme-original/DocSidebarItems';
import type {Props} from '@theme/DocSidebarItems';
import {FrameworkTabs} from '@site/src/components/FrameworkTabs';

export default function DocSidebarItemsWrapper(props: Props): ReactNode {
  if (props.level === 1) {
    return (
      <>
        <li className="menu__list-item fw-sidebar-switch-item">
          <div className="fw-sidebar-switch">
            <BrowserOnly>
              {() => <FrameworkTabs className="fw-tabs--sidebar" />}
            </BrowserOnly>
          </div>
        </li>
        <DocSidebarItems {...props} />
      </>
    );
  }
  return <DocSidebarItems {...props} />;
}

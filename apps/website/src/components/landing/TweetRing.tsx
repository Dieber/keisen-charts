import {useMemo, useRef, type ReactNode} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {Billboard, Html} from '@react-three/drei';
import {Vector3, type Group} from 'three';
import {FAKE_TWEETS, type FakeTweet} from './tweets';
import styles from './TweetRing.module.css';

const RADIUS = 5.1;
const ROTATION_SPEED = 0.12;
const _world = new Vector3();
/** Marks the TweetRing DOM root; z-index sync must not walk past this. */
const RING_ROOT_SELECTOR = '[data-tweet-ring]';

function TweetCard({tweet}: {tweet: FakeTweet}) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <span className={styles.avatar} aria-hidden>
          {tweet.avatar}
        </span>
        <div className={styles.meta}>
          <span className={styles.name}>{tweet.name}</span>
          <span className={styles.handle}>
            {tweet.handle} · {tweet.time}
          </span>
        </div>
      </header>
      <p className={styles.text}>{tweet.text}</p>
    </article>
  );
}

function TweetOnRing({
  tweet,
  angle,
  radius,
}: {
  tweet: FakeTweet;
  angle: number;
  radius: number;
}) {
  const groupRef = useRef<Group>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    const group = groupRef.current;
    const shell = shellRef.current;
    if (!group || !shell) {
      return;
    }
    group.getWorldPosition(_world);
    // 0 at back → 1 at front; front band stays fully opaque
    const t = Math.max(0, Math.min(1, (_world.z + radius) / (2 * radius)));
    const opacity = t >= 0.2 ? 1 : 0.12 + (t / 0.68) * 0.88;
    const zIndex = Math.round(1 + t * 9999);
    shell.style.opacity = String(opacity);
    shell.style.zIndex = String(zIndex);

    // Sync z-index onto drei Html wrappers so opacity under matrix3d stays crisp.
    // Hard-stop at the canvas host / ring root — never walk to body.
    const bound = shell.closest(RING_ROOT_SELECTOR);
    let el: HTMLElement | null = shell.parentElement;
    while (
      el &&
      el !== bound &&
      el !== document.body &&
      el !== document.documentElement
    ) {
      if (el.querySelector('canvas')) {
        break;
      }
      el.style.zIndex = String(zIndex);
      el = el.parentElement;
    }
  });

  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <Billboard follow>
        <Html
          transform
          center
          /* Scale = distanceFactor / dist; keep ≤1 at the front (~6.9) for crisp text */
          distanceFactor={6.2}
          zIndexRange={[10000, 1]}>
          <div ref={shellRef} className={styles.cardShell}>
            <TweetCard tweet={tweet} />
          </div>
        </Html>
      </Billboard>
    </group>
  );
}

function RotatingRing({tweets}: {tweets: FakeTweet[]}) {
  const ringRef = useRef<Group>(null);
  const items = useMemo(
    () =>
      tweets.map((tweet, index) => ({
        tweet,
        angle: (index / tweets.length) * Math.PI * 2,
      })),
    [tweets],
  );

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * ROTATION_SPEED;
    }
  });

  return (
    <group ref={ringRef} rotation={[0.08, 0, 0.04]}>
      {items.map(({tweet, angle}) => (
        <TweetOnRing
          key={tweet.id}
          tweet={tweet}
          angle={angle}
          radius={RADIUS}
        />
      ))}
    </group>
  );
}

export default function TweetRing(): ReactNode {
  return (
    <div className={styles.canvasWrap} data-tweet-ring>
      <Canvas
        camera={{position: [0, 0.9, 12], fov: 40}}
        dpr={[1, 1.75]}
        gl={{antialias: true, alpha: true}}
        style={{background: 'transparent'}}>
        <ambientLight intensity={1} />
        <RotatingRing tweets={FAKE_TWEETS} />
      </Canvas>
    </div>
  );
}

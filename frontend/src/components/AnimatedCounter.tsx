import CountUpModule from 'react-countup';
const CountUp = (CountUpModule as any).default || CountUpModule;
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

export default function AnimatedCounter({
  end,
  suffix = '',
  prefix = '',
  duration = 2.5,
  decimals = 0,
}: AnimatedCounterProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <span ref={ref}>
      {inView ? (
        <CountUp
          start={0}
          end={end}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
          separator=","
        />
      ) : (
        <span>{prefix}0{suffix}</span>
      )}
    </span>
  );
}

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export const LoadingSpinner = ({ size = 'md', className = '' }: Props) => {
  return (
    <div
      className={`
        animate-spin rounded-full
        border-muted border-t-primary
        ${sizeMap[size]} ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );
};
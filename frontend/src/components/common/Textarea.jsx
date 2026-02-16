import { forwardRef } from 'react';

const Textarea = forwardRef(({
  label,
  error,
  maxLength,
  value = '',
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors resize-none
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {maxLength && (
          <p className={`text-sm ml-auto ${value.length >= maxLength ? 'text-red-500' : 'text-gray-400'}`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

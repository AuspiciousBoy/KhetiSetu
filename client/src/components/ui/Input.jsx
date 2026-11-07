import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon,
      className = '',
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant font-label-md"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant/70">
              {typeof icon === 'string' ? (
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              ) : (
                icon
              )}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant/60 rounded-[12px] py-3 text-sm transition-all duration-200 border border-transparent focus:border-primary focus:bg-surface-bright focus:outline-none focus:ring-1 focus:ring-primary ${
              icon ? 'pl-11 pr-4' : 'px-4'
            } ${error ? 'border-error focus:border-error focus:ring-error' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-error font-medium flex items-center gap-1.5 mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-on-surface-variant/70">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

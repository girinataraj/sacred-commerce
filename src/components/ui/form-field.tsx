import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
type FieldProps={ id:string; label:string; hint?:string; error?:string };
export function FormField({ id,label,hint,error,required,...props }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const description=[hint && `${id}-hint`,error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return <div className="form-field"><label htmlFor={id}>{label}{required && <span className="required-label"> (required)</span>}</label>{hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}<input {...props} id={id} required={required} aria-invalid={error ? true : undefined} aria-describedby={description} />{error && <p id={`${id}-error`} className="field-error">{error}</p>}</div>;
}
export function SelectField({ id,label,children,...props }: { id:string; label:string; children:ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="form-field"><label htmlFor={id}>{label}</label><select {...props} id={id}>{children}</select></div>;
}

export default function Button({ children, onClick, variant = 'primary', disabled = false, style = {}, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`.trim()}
      style={style}
    >
      {children}
    </button>
  )
}

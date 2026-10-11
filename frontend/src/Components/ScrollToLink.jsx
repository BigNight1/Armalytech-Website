
const ScrollToLink = ({ to, children, className, onClick, ...rest }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const el = document.getElementById(to);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={className}
      {...rest}
    >
      {children}
    </span>
  );
};

export default ScrollToLink;

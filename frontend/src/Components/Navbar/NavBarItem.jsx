import ScrollToLink from "../ScrollToLink.jsx";

const NavBarItem = ({ name, to, current, dark }) => {
  const baseClass = "block py-2 px-3 rounded md:p-0 cursor-pointer relative";
  const darkClass = dark
    ? "text-gray-300 hover:text-white md:dark:text-gray-300 md:dark:hover:text-white"
    : "text-gray-900 hover:bg-gray-100 md:hover:bg-transparent md:text-blue-700 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 md:dark:hover:bg-transparent";
  const activeClass = current
    ? dark
      ? "text-white md:text-orange-400"
      : "text-white bg-blue-700 md:bg-transparent md:text-blue-700 dark:md:text-blue-500"
    : "";

  return (
    <li>
      <ScrollToLink
        to={to}
        className={`${baseClass} ${darkClass} ${activeClass}`}
        aria-current={current ? "page" : undefined}
      >
        {name}
      </ScrollToLink>
    </li>
  );
};

export default NavBarItem;

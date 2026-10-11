const TAB_STYLE = {
  base: 'mb-[-2px] cursor-pointer border-0 border-b-[3px] bg-transparent pb-2.5 pt-2.5 text-[15px]',
  active: 'border-accent font-bold text-ink',
  inactive: 'border-transparent font-semibold text-muted',
};

/** Perfil / Configuración tab strip (design: `tabPerfil`/`tabConfig`). */
export default function AccountTabs({ active, onChange }) {
  return (
    <div className="flex gap-7 border-b-2 border-line">
      <button
        type="button"
        onClick={() => onChange('perfil')}
        className={`${TAB_STYLE.base} ${active === 'perfil' ? TAB_STYLE.active : TAB_STYLE.inactive}`}
      >
        Perfil
      </button>
      <button
        type="button"
        onClick={() => onChange('config')}
        className={`${TAB_STYLE.base} ${active === 'config' ? TAB_STYLE.active : TAB_STYLE.inactive}`}
      >
        Configuración
      </button>
    </div>
  );
}

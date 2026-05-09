import { PersonaTile } from "@/components/brand";
import { personas } from "@/lib/personas";

type PersonaButtonsProps = {
  activeId?: string;
};

export function PersonaButtons({ activeId }: PersonaButtonsProps) {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {personas.map((p) => (
        <li key={p.id} className="flex">
          <PersonaTile
            persona={p}
            variant="compact"
            active={activeId === p.id}
            className="w-full justify-start"
          />
        </li>
      ))}
    </ul>
  );
}

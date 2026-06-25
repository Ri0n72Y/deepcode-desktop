import { Button } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { useSkillStore } from "../../stores/skill-store";

type SkillsPopupProps = {
  open: boolean;
};

export default function SkillsPopup({ open }: SkillsPopupProps) {
  const available = useSkillStore((state) => state.available);
  const selected = useSkillStore((state) => state.selected);
  const toggle = useSkillStore((state) => state.toggle);

  return (
    <div className={`skills-popup ${open ? "show" : ""}`}>
      <div className="skills-popup-header">Select Skills</div>
      <div className="skills-popup-list">
        {available.length === 0 ? <div className="skills-popup-empty">No skills found</div> : null}
        {available.map((skill) => {
          const isSelected = selected.some((item) => item.name === skill.name);
          return (
            <Button className={`skills-popup-item ${isSelected ? "selected" : ""}`} key={skill.name} onClick={() => toggle(skill)} type="button">
              <span className="skills-popup-item-name">{skill.name}</span>
              <span className="skills-popup-item-path">{skill.path}</span>
              {skill.isLoaded || isSelected ? <CheckCircleIcon className="skills-popup-item-loaded" /> : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

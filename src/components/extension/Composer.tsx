import { Button, Textarea } from "@headlessui/react";
import { PaperAirplaneIcon, StopIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSkillStore } from "../../stores/skill-store";
import ContextMeter from "./ContextMeter";
import PermissionPromptHost from "./PermissionPromptHost";
import SkillsPopup from "./SkillsPopup";

export default function Composer() {
  const client = useRuntimeClient();
  const loading = useRuntimeStore((state) => state.loading);
  const selectedSkills = useSkillStore((state) => state.selected);
  const removeSkill = useSkillStore((state) => state.remove);
  const [text, setText] = useState("");
  const [skillsOpen, setSkillsOpen] = useState(false);

  async function submit() {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setText("");
    await client?.prompt({ text: prompt, skills: selectedSkills });
  }

  async function sendOrStop() {
    if (loading) {
      await client?.interrupt();
      return;
    }
    await submit();
  }

  return (
    <div className="composer">
      <SkillsPopup open={skillsOpen} />
      <PermissionPromptHost />
      <div className="input-wrap">
        <div className="tools-line" />
        <Textarea
          id="prompt"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="Ask Deep Code"
          rows={3}
          value={text}
        />
        <div className="composer-footer">
          <div className="skills-bar">
            <Button className="skills-button" onClick={() => setSkillsOpen((value) => !value)} type="button">Skills</Button>
            <ContextMeter />
            <div className="skills-tags">
              <div className="skills-tags-inner">
                {selectedSkills.map((skill) => (
                  <span className="skill-tag" key={skill.name}>
                    <span className="skill-tag-name">{skill.name}</span>
                    <Button className="skill-tag-remove" onClick={() => removeSkill(skill.name)} type="button" aria-label={`Remove ${skill.name}`}>
                      <XMarkIcon className="skill-tag-remove-icon" />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Button className="send-button" onClick={() => void sendOrStop()} type="button" aria-label={loading ? "Stop generation" : "Send prompt"}>
            {loading ? <StopIcon id="stopIcon" /> : <PaperAirplaneIcon id="sendIcon" className={text.trim() ? "" : "empty"} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

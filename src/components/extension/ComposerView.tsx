import { Button, Textarea } from "@headlessui/react";
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useMemo, useState } from "react";
import { useRuntimeClient } from "../../app/providers";
import { cn } from "../../lib/utils/cn";
import { useRuntimeStore } from "../../stores/runtime-store";
import { useSkillStore } from "../../stores/skill-store";
import ContextPopover from "./ContextPopover";
import PermissionPromptHost from "./PermissionPromptHost";
import SkillsPopup from "./SkillsPopup";

export default function ComposerView() {
  const client = useRuntimeClient();
  const loading = useRuntimeStore((state) => state.loading);
  const selectedSkills = useSkillStore((state) => state.selected);
  const removeSkill = useSkillStore((state) => state.remove);
  const [text, setText] = useState("");
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rows = useMemo(() => Math.max(3, Math.min(10, text.split("\n").length)), [text]);

  async function submit() {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setText("");
    setFullscreen(false);
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
      <div className={cn("input-wrap", fullscreen && "fullscreen")}>
        <Button className="prompt-fullscreen-button" onClick={() => setFullscreen((value) => !value)} type="button" aria-label={fullscreen ? "Exit fullscreen composer" : "Expand composer"}>
          {fullscreen ? <ArrowsPointingInIcon className="prompt-fullscreen-icon" /> : <ArrowsPointingOutIcon className="prompt-fullscreen-icon" />}
        </Button>
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
          placeholder="Write a prompt..."
          rows={fullscreen ? 12 : rows}
          value={text}
        />
        <div className="composer-footer">
          <div className="skills-bar">
            <Button className="skills-button" onClick={() => setSkillsOpen((value) => !value)} type="button">
              <SkillGlyph />
              <span>Skill</span>
            </Button>
            <ContextPopover />
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
            {loading ? <StopGlyph /> : <SendGlyph empty={!text.trim()} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SkillGlyph() {
  return (
    <svg className="skills-button-icon" viewBox="0 0 1102 1024" aria-hidden="true">
      <path d="M1080.647345 359.858716l-149.888622 86.404529v341.128546c0 12.287244-6.616208 23.629315-17.564458 30.00923l-344.594179 201.243001a38.121962 38.121962 0 0 1-38.437019 0l-344.594179-201.243001a34.813858 34.813858 0 0 1-17.564458-29.930465V446.026952L17.879515 359.858716A34.971386 34.971386 0 0 1 0 329.691957c0-12.287244 6.773737-23.70808 17.879515-30.166759L530.320596 5.025168a38.594548 38.594548 0 0 1 37.885668 0l512.441081 294.578795c11.027014 6.301151 17.879515 17.800751 17.879515 30.087994a34.971386 34.971386 0 0 1-17.879515 30.166759zM549.224048 76.149406l-441.080549 253.621316 441.080549 253.463787 441.080549-253.542552-441.080549-253.542551z m307.811211 412.331549L568.206264 654.516276a38.358255 38.358255 0 0 1-37.885668 0L241.491601 488.402191v279.377269l307.732447 179.740323 307.811211-179.740323V488.402191z m208.883146-65.847025c20.321211 0 36.782967 15.752877 36.782967 35.20768v197.698603c0 19.533567-16.540521 35.286444-36.782967 35.286444a35.995323 35.995323 0 0 1-36.782967-35.20768V457.84161c0-19.454803 16.461756-35.20768 36.782967-35.20768z" />
    </svg>
  );
}

function SendGlyph({ empty }: { empty: boolean }) {
  return (
    <svg className={cn("send-icon", empty && "empty")} id="sendIcon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M27,5c-2.9-2.9-6.9-4.6-11-4.6S7.9,2.1,5,5c-2.9,2.9-4.6,6.9-4.6,11S2.1,24.1,5,27c2.9,2.9,6.9,4.6,11,4.6 s8.1-1.6,11-4.6c2.9-2.9,4.6-6.9,4.6-11S29.9,7.9,27,5z M23.2,11c-0.2,2.5-1.2,8.4-1.8,11.2c-0.2,1.2-0.6,1.6-1.1,1.6 c-0.9,0.1-1.6-0.6-2.5-1.2c-1.4-0.9-2.1-1.5-3.5-2.3c-1.5-1-0.5-1.6,0.3-2.5c0.2-0.2,4.2-3.9,4.3-4.2c0,0,0-0.2-0.1-0.3 c-0.1-0.1-0.2-0.1-0.3,0c-0.1,0-2.3,1.5-6.6,4.3c-0.6,0.4-1.2,0.6-1.7,0.6c-0.6,0-1.6-0.3-2.4-0.6c-1-0.3-1.7-0.5-1.7-1 c0-0.3,0.4-0.6,1.2-0.9c4.5-2,7.6-3.3,9.1-3.9c4.3-1.8,5.2-2.1,5.8-2.1c0.1,0,0.4,0,0.6,0.2c0.2,0.1,0.2,0.3,0.2,0.4 C23.2,10.5,23.2,10.8,23.2,11L23.2,11z" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg className="send-icon" id="stopIcon" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M5,4.9c-6.1,6.1-6.1,16,0,22.1c6.1,6.1,16,6.1,22.1,0s6.1-16,0-22.1C21-1.1,11.1-1.2,5,4.9z M21,12.5l0,7 c0,0.8-0.7,1.5-1.5,1.5l-7,0c-0.8,0-1.5-0.7-1.5-1.5l0-7c0-0.8,0.7-1.5,1.5-1.5l7,0C20.3,11,21,11.7,21,12.5z" />
    </svg>
  );
}

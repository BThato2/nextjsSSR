import { useEffect, useState, Fragment } from "react";
import { type Extension } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@/helpers/code";
import { color } from "@uiw/codemirror-extensions-color";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

export default function CodeTextArea({
  code,
  setCode,
  editable,
}: {
  code: string;
  setCode: (code: string) => void;
  editable?: boolean;
}) {
  const [mode, setMode] = useState("javascript");
  const [extensions, setExtensions] = useState<Extension[]>();

  const handleLangChange = (lang: keyof typeof langs) => {
    if (langs[lang]) {
      setExtensions([color, langs[lang]()]);
    } else {
      setExtensions([color]);
    }
    setMode(lang);
  };

  useEffect(() => {
    handleLangChange("javascript");
  }, []);
  return (
    <div
      contentEditable={false}
      className="flex w-full flex-col overflow-hidden rounded-lg border border-neutral-700"
    >
      <div className="flex w-full justify-end border-b border-neutral-700 bg-neutral-900 px-4 py-1">
        {editable ? (
          <Listbox
            value={mode}
            onChange={(changedMode: string) =>
              handleLangChange(changedMode as keyof typeof langs)
            }
          >
            <div className="relative flex w-full flex-col items-end">
              <Listbox.Button className="relative cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 py-1 pl-3 pr-10 text-left shadow-md ">
                <span className="block truncate text-sm">{mode}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="w-4 text-gray-400" />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-20 mt-12 max-h-60 overflow-auto rounded-lg border border-neutral-800  bg-neutral-900 text-base shadow-lg  sm:text-sm">
                  {Object.keys(langs).map((lang) => (
                    <Listbox.Option
                      key={lang}
                      className={`cursor-pointer select-none p-[5px]`}
                      value={lang}
                    >
                      {({ selected }) => (
                        <>
                          <span
                            className={`block truncate rounded-lg px-4 py-1 font-medium text-neutral-300 hover:bg-neutral-800 hover:text-neutral-200 ${
                              selected
                                ? "bg-pink-600 text-neutral-100 hover:bg-pink-600 hover:text-neutral-100"
                                : ""
                            }`}
                          >
                            {lang}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        ) : (
          <span className="text-sm text-neutral-400">{mode}</span>
        )}
      </div>
      <CodeMirror
        className="relative w-full overflow-auto rounded-b-lg text-left"
        value={code}
        height={"400px"}
        theme={vscodeDark}
        editable={editable}
        extensions={extensions}
        autoFocus={true}
        basicSetup={{ autocompletion: false }}
        placeholder={""}
        onChange={(value) => setCode(value)}
      />
    </div>
  );
}

CodeTextArea.defaultProps = {
  editable: true,
};

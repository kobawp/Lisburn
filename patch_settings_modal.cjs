const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

// Add to props interface
code = code.replace(/onSignOut\?: \(\) => void;/g, "onSignOut?: () => void;\n  activeSyncCode?: string;\n  updateSyncCode?: (c: string) => void;");

// Destructure from props
code = code.replace(/onSignOut\s*\}\) => \{/, "onSignOut,\n  activeSyncCode = '',\n  updateSyncCode\n}) => {");

// Add state for editing code
code = code.replace(/const \[resetState, setResetState\] = useState/, `const [isEditingSync, setIsEditingSync] = useState(false);
  const [syncInput, setSyncInput] = useState('');
  const [resetState, setResetState] = useState`);

const syncUI = `              <div className="px-5 py-3 space-y-4">
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white text-sm font-bold">Secret Sync Code</h4>
                      <p className="text-xs text-[#A0A0A0] mt-0.5">Use this code on another device to link them.</p>
                    </div>
                    {activeSyncCode && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeSyncCode);
                          alert('Sync Code copied to clipboard!');
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  
                  {isEditingSync ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={syncInput}
                        onChange={(e) => setSyncInput(e.target.value.toUpperCase())}
                        placeholder="e.g. LISB-XXXX-XXXX"
                        className="flex-1 bg-black/40 border border-[#AB70D5]/30 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#AB70D5] uppercase"
                      />
                      <button
                        onClick={() => {
                          if (syncInput.trim().length > 4 && updateSyncCode) {
                            updateSyncCode(syncInput.trim());
                            setIsEditingSync(false);
                          }
                        }}
                        className="px-4 py-2 bg-[#AB70D5] hover:bg-[#a165c9] text-white font-bold text-sm rounded-lg transition-colors"
                      >
                        Connect
                      </button>
                      <button
                        onClick={() => setIsEditingSync(false)}
                        className="px-3 py-2 text-[#777777] hover:text-white text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-black/40 rounded-lg p-3 border border-white/5">
                      <code className="text-[#AB70D5] font-mono font-bold tracking-wider">{activeSyncCode || 'Loading...'}</code>
                      <button
                        onClick={() => {
                          setSyncInput(activeSyncCode || '');
                          setIsEditingSync(true);
                        }}
                        className="text-xs text-[#777777] hover:text-white underline decoration-white/20 underline-offset-4 transition-colors"
                      >
                        Enter Existing Code
                      </button>
                    </div>
                  )}
                </div>
                
                <p className="text-[11px] text-[#A0A0A0] leading-relaxed">
                  Your tasks are continuously synced to Firebase Cloud Firestore using this unique code. 
                  Keep it secret, as anyone with this code can view and edit your tasks.
                </p>
              </div>`;

// Find the Cloud Sync content and replace it
code = code.replace(/<div className="px-5 py-3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div className="space-y-4">/, syncUI + "\n            </div>\n          </div>\n\n          <div className=\"space-y-4\">");

fs.writeFileSync('src/components/SettingsModal.tsx', code);

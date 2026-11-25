/* Prayer spells. level is required. drain is seconds per prayer point. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.prayers = [
  { id: "thick_skin", name: "Thick Skin", level: 1, drain: 36, effect: "defence", amount: 0.05, tip: "+5% defence. 1 point / 36s.", sound: "Thick_Skin.ogg" },
  { id: "burst_of_strength", name: "Burst of Strength", level: 4, drain: 36, effect: "strength", amount: 0.05, tip: "+5% strength. 1 point / 36s.", sound: "Burst_of_Strength.ogg" },
  { id: "clarity_of_thought", name: "Clarity of Thought", level: 7, drain: 36, effect: "attack", amount: 0.05, tip: "+5% attack. 1 point / 36s.", sound: "Clarity_of_Thought.ogg" },
  { id: "sharp_eye", name: "Sharp Eye", level: 8, drain: 36, effect: "ranged", amount: 0.05, tip: "+5% ranged attack and +5% ranged strength. 1 point / 36s.", sound: "Sharp_Eye.ogg.mp3" },
];

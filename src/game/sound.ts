type SoundName='coin'|'power'|'hit'|'buy';
let context:AudioContext|undefined;
export function playSound(name:SoundName,enabled:boolean){
  if(!enabled||typeof window==='undefined')return;
  try{
    context??=new AudioContext();if(context.state==='suspended')void context.resume();
    const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain(),freq=name==='coin'?880:name==='power'?590:name==='buy'?740:145;
    osc.type=name==='hit'?'sawtooth':'square';osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(name==='hit'?65:freq*1.35,now+.09);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
    osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.13);
  }catch{/* Audio is optional and can be unavailable in restricted browsers. */}
}

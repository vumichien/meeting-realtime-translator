export async function playToneWithFeedback(button: HTMLButtonElement, deviceId: string): Promise<void> {
  const originalText = button.textContent ?? "Play test tone";
  button.textContent = "Playing...";
  button.disabled = true;
  try {
    await playTone(deviceId);
    button.textContent = "Played";
  } catch {
    button.textContent = "Try again";
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 900);
  }
}

async function playTone(deviceId: string): Promise<void> {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  const dest = ctx.createMediaStreamDestination();
  oscillator.frequency.value = 440;
  oscillator.connect(dest);
  const audio = new Audio();
  audio.srcObject = dest.stream;
  if (deviceId && "setSinkId" in audio) {
    await (audio as HTMLAudioElement & { setSinkId(id: string): Promise<void> }).setSinkId(deviceId);
  }
  oscillator.start();
  await audio.play();
  await new Promise<void>((resolve) => {
    window.setTimeout(() => {
      oscillator.stop();
      void ctx.close();
      resolve();
    }, 1200);
  });
}

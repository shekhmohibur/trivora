// frontend/pages/match.tsx
import React, { useEffect, useRef, useState } from 'react';
import MatchLayout from '../components/Layout/MatchLayout';
import useSocket from '../hooks/useSocket';
import dynamic from 'next/dynamic';

export default function MatchPage() {
  const socketRef = useSocket();
  const [status, setStatus] = useState<'idle'|'queued'|'matched'|'incall'>('idle');
  const [peerMeta, setPeerMeta] = useState<any>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const s = socketRef.current;
    if(!s) return;
    s.on('queued', ()=> setStatus('queued'));
    s.on('matched', async ({ room, peerId, peerMeta }: any) => {
      setStatus('matched');
      setPeerMeta(peerMeta);
      await initCall(peerId);
    });
    s.on('signal', async ({ from, data }: any) => { await handleSignal(from, data) });
  }, [socketRef.current]);

  async function joinQueue() {
    const s = socketRef.current!;
    s.emit('join_queue', { userType: 'guest', countries: [] });
    setStatus('queued');
  }

  async function initCall(peerId: string) {
    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    pc.ontrack = e => {
      if(remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
        remoteAudioRef.current.play().catch(()=>{});
      }
    };
    pc.onicecandidate = e => {
      if(e.candidate) socketRef.current?.emit('signal', { to: peerId, data: e.candidate });
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if(localAudioRef.current) localAudioRef.current.srcObject = stream;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketRef.current?.emit('signal', { to: peerId, data: offer });
    setStatus('incall');
  }

  async function handleSignal(from: string, data: any) {
    let pc = pcRef.current;
    if(data.type === 'offer') {
      pc = new RTCPeerConnection();
      pcRef.current = pc;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      await pc.setRemoteDescription(data);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketRef.current?.emit('signal', { to: from, data: pc.localDescription });
      pc.ontrack = e => {
        if(remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = e.streams[0];
          remoteAudioRef.current.play().catch(()=>{});
        }
      };
      pc.onicecandidate = e => {
        if(e.candidate) socketRef.current?.emit('signal', { to: from, data: e.candidate });
      };
      setStatus('incall');
    } else if(data.type === 'answer') {
      if(pc) await pc.setRemoteDescription(data);
    } else if(data.candidate && pc) {
      try { await pc.addIceCandidate(data); } catch(e){ console.error(e) }
    }
  }

  return (
    <MatchLayout profile={{ badge: 'Guest' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4">
        {/* Center: Match / Chat area */}
        <div className="flex-1 bg-[color:var(--surface)]/30 rounded-lg p-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Match</h3>
            <div className="text-sm text-[color:var(--muted)]">Status: {status}</div>
          </div>

          {/* Matching card */}
          {status !== 'incall' && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center space-y-3">
                <h2 className="text-2xl">Find someone to talk to</h2>
                <p className="text-[color:var(--muted)]">One-on-one voice & text chat</p>
                <div className="mt-4">
                  <button onClick={joinQueue} className="px-5 py-3 rounded-md bg-[color:var(--accent)] hover:brightness-105">Find Partner</button>
                </div>
              </div>
            </div>
          )}

          {/* In-call UI */}
          {status === 'incall' && (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-4 py-3 border-b border-white/5">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">A</div>
                <div>
                  <div className="font-medium">{peerMeta?.name || 'Guest'}</div>
                  <div className="text-xs text-[color:var(--muted)]">{peerMeta?.country || 'Unknown'}</div>
                </div>
                <div className="ml-auto flex gap-2">
                  <button className="text-sm px-3 py-1 rounded bg-white/5">Mute</button>
                  <button className="text-sm px-3 py-1 rounded bg-red-600">End</button>
                </div>
              </div>

              {/* messages area (placeholder) */}
              <div className="flex-1 overflow-auto p-3">
                <div className="text-[color:var(--muted)]">Audio is live — use speaker controls of your device.</div>
              </div>

              {/* Bottom controls */}
              <div className="mt-2 flex items-center gap-2">
                <button className="px-3 py-2 rounded bg-white/6">Text</button>
                <button className="px-3 py-2 rounded bg-white/6">Emoji</button>
                <button className="px-3 py-2 rounded bg-white/6">Image</button>
                <div className="flex-1"></div>
                <div className="text-sm text-[color:var(--muted)]">Guest</div>
              </div>
            </div>
          )}

          <audio ref={localAudioRef} autoPlay muted className="hidden" />
          <audio ref={remoteAudioRef} autoPlay className="hidden" />
        </div>

        {/* Right: Profile drawer (visible on md+) */}
        <div className="hidden md:block w-80">
          <div className="bg-[color:var(--surface)]/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">P</div>
              <div>
                <div className="font-medium">{peerMeta?.name || 'Waiting...'}</div>
                <div className="text-xs text-[color:var(--muted)]">{peerMeta?.country || '—'}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-[color:var(--muted)]">
              Use report/favorite controls when connected.
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-3 py-2 rounded bg-white/5">Favorite</button>
              <button className="flex-1 px-3 py-2 rounded bg-red-600">Report</button>
            </div>
          </div>
        </div>
      </div>
    </MatchLayout>
  )
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  Volume2, 
  Printer, 
  Radio, 
  Globe, 
  ArrowRightLeft, 
  ToggleLeft, 
  ToggleRight, 
  Play, 
  CheckCircle,
  Clock,
  Send,
  ShieldCheck
} from 'lucide-react';

interface DeviceItem {
  id: string;
  name: string;
  category: 'processor' | 'storage' | 'network' | 'audio';
  status: 'Active' | 'Idle' | 'Unmounted' | 'Mounted';
  details: string;
  irq: number;
}

interface PrintJob {
  id: string;
  filename: string;
  sizeKb: number;
  progress: number;
  status: 'Queued' | 'Printing' | 'Completed';
}

interface DeviceNetworkViewProps {
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export default function DeviceNetworkView({ showToast }: DeviceNetworkViewProps) {
  const [activeTab, setActiveTab] = useState<'devices' | 'network'>('devices');
  
  // Device Manager States
  const [devices, setDevices] = useState<DeviceItem[]>([
    { id: 'cpu0', name: 'Intel Xeon Core 0', category: 'processor', status: 'Active', details: 'Temp: 42°C, Clock: 3.4GHz, Duty: 12%', irq: 0 },
    { id: 'cpu1', name: 'Intel Xeon Core 1', category: 'processor', status: 'Active', details: 'Temp: 44°C, Clock: 3.4GHz, Duty: 8%', irq: 1 },
    { id: 'ram1', name: 'Primary RAM Bank A', category: 'storage', status: 'Active', details: 'DDR4 2666MHz, ECC Enabled', irq: 4 },
    { id: 'nvme0', name: 'SDA Primary PCIe NVMe', category: 'storage', status: 'Idle', details: 'S.M.A.R.T. Health: 100%, Temp: 38°C', irq: 14 },
    { id: 'usb0', name: 'SDB Mass USB Drive', category: 'storage', status: 'Unmounted', details: 'FAT32 File Format, USB 3.1 Interface', irq: 15 },
    { id: 'nic0', name: 'Gigabit Ethernet Adapter (eth0)', category: 'network', status: 'Active', details: 'Full Duplex, Link speed: 1000 Mbps', irq: 11 },
    { id: 'sound0', name: 'Intel High Definition Audio', category: 'audio', status: 'Idle', details: 'Stereo Out, Sampling rate: 48kHz', irq: 5 }
  ]);

  const [printerJobs, setPrinterJobs] = useState<PrintJob[]>([
    { id: 'p1', filename: 'os_syllabus.pdf', sizeKb: 124, progress: 100, status: 'Completed' },
    { id: 'p2', filename: 'lab_report_final.txt', sizeKb: 42, progress: 35, status: 'Printing' }
  ]);
  const [newJobName, setNewJobName] = useState('');

  // Network States
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [routingTable] = useState([
    { destination: '0.0.0.0', gateway: '192.168.1.1', flags: 'UG', interface: 'eth0' },
    { destination: '127.0.0.0', gateway: '0.0.0.0', flags: 'U', interface: 'lo0' },
    { destination: '192.168.1.0', gateway: '0.0.0.0', flags: 'U', interface: 'eth0' }
  ]);

  // Network Speed Simulator
  const [rxSpeed, setRxSpeed] = useState(124); // KB/s
  const [txSpeed, setTxSpeed] = useState(38); // KB/s

  // Ping Tool States
  const [pingTarget, setPingTarget] = useState('google.com');
  const [pingLines, setPingLines] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const pingEndRef = useRef<HTMLDivElement>(null);

  // Periodic hardware tick simulator
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomize core temperatures & duties slightly
      setDevices(prev => prev.map(dev => {
        if (dev.id.startsWith('cpu')) {
          const randTemp = Math.floor(40 + Math.random() * 8);
          const randDuty = Math.floor(5 + Math.random() * 25);
          return {
            ...dev,
            details: `Temp: ${randTemp}°C, Clock: 3.4GHz, Duty: ${randDuty}%`
          };
        }
        return dev;
      }));

      // Randomize Network Traffic
      setRxSpeed(prev => Math.max(10, Math.min(1500, prev + Math.floor(Math.random() * 100 - 50))));
      setTxSpeed(prev => Math.max(5, Math.min(600, prev + Math.floor(Math.random() * 40 - 20))));

      // Advance printer job progress
      setPrinterJobs(prev => prev.map(job => {
        if (job.status === 'Printing') {
          const nextProg = job.progress + 15;
          if (nextProg >= 100) {
            fetch('/api/filesystem/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: `printed_${job.filename}`,
                type: 'file',
                parentId: 'root',
                content: `--- MiniKernel Print Spooler --- \nPrinted Document Stream: ${job.filename}\nFinished successfully at ${new Date().toLocaleTimeString()}\nSize: ${job.sizeKb}KB\nSTATUS: RING_0_SUCCESS`
              })
            }).catch(err => console.error('Spooler file write back:', err));

            return { ...job, progress: 100, status: 'Completed' };
          }
          return { ...job, progress: nextProg };
        }
        return job;
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom of ping logger
  useEffect(() => {
    pingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pingLines]);

  const handleSmartDiagnostic = async (devName: string) => {
    try {
      await fetch('/api/filesystem/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `smart_diag_${devName.toLowerCase().replace(/\s+/g, '_')}.log`,
          type: 'file',
          parentId: 'root',
          content: `--- S.M.A.R.T. Hardware Health Diagnostic ---\nDevice: ${devName}\nDate: ${new Date().toString()}\nSectors Scanned: 4,194,304\nBad Sectors Found: 0\nThermal Regulation: OK\nOverall Score: EXCELLENT\nSTATUS: DEVICE_READY`
        })
      });
      if (showToast) {
        showToast(`S.M.A.R.T. Diagnostic logs successfully compiled and saved to VFS root directory for ${devName}!`, 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAudioTest = () => {
    // Post to logs API
    fetch('/api/filesystem/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'sound_test.log',
        type: 'file',
        parentId: 'root',
        content: `--- MiniKernel Audio Bus Test ---\nTriggered 440Hz standard sine wave test tone.\nInterface: ALSA DirectBus Audio Channel 5\nIRQ Status: INTERRUPT_TRIGGERED\nSuccess flag: OK`
      })
    }).catch(e => console.error(e));
    if (showToast) {
      showToast("Audio test tone triggered on IRQ 5! Logs recorded in system filesystem.", 'success');
    }
  };

  const toggleUsbMount = () => {
    setDevices(prev => prev.map(d => {
      if (d.id === 'usb0') {
        const isMounted = d.status === 'Mounted';
        return {
          ...d,
          status: isMounted ? 'Unmounted' : 'Mounted',
          details: isMounted 
            ? 'FAT32 File Format, USB 3.1 Interface' 
            : 'FAT32 Mounted at /media/usb0, Storage: 16GB free'
        };
      }
      return d;
    }));
  };

  const handleAddPrintJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    const cleaned = newJobName.trim().replace(/[^a-zA-Z0-9_\.-]/g, '');
    const newJob: PrintJob = {
      id: 'p_' + Date.now(),
      filename: cleaned,
      sizeKb: Math.floor(10 + Math.random() * 200),
      progress: 0,
      status: 'Queued'
    };

    setPrinterJobs(prev => {
      const updated = [...prev, newJob];
      // If there are no active printing jobs, make this one print!
      if (!updated.some(j => j.status === 'Printing')) {
        updated[updated.length - 1].status = 'Printing';
      }
      return updated;
    });

    setNewJobName('');
  };

  const handleTriggerPing = () => {
    if (!pingTarget.trim() || isPinging) return;
    setIsPinging(true);
    setPingLines([`PING ${pingTarget.trim()} (172.217.16.142) 56(84) bytes of data.`]);

    let count = 1;
    const maxPings = 5;

    const interval = setInterval(() => {
      const ms = (10 + Math.random() * 15).toFixed(1);
      setPingLines(prev => [
        ...prev,
        `64 bytes from ${pingTarget.trim()} (172.217.16.142): icmp_seq=${count} ttl=64 time=${ms} ms`
      ]);

      count++;
      if (count > maxPings) {
        clearInterval(interval);
        setTimeout(() => {
          setPingLines(prev => [
            ...prev,
            ` `,
            `--- ${pingTarget.trim()} ping statistics ---`,
            `${maxPings} packets transmitted, ${maxPings} received, 0% packet loss, time ${maxPings * 1000}ms`,
            `rtt min/avg/max/mdev = 10.2/12.5/15.8/1.2 ms`
          ]);
          setIsPinging(false);
        }, 300);
      }
    }, 1000);
  };

  return (
    <div id="device-network-container" className="p-6 space-y-6 overflow-y-auto h-full text-slate-100 flex flex-col">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-white">Hardware & Network Interface Manager</h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">Control virtual motherboard controllers, view IRQ line registers, print job spoolers, and execute packet tracer diagnostics.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-1.5 shrink-0 font-mono text-xs">
        <button
          onClick={() => setActiveTab('devices')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
            activeTab === 'devices' 
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Cpu size={14} />
          <span>MOTHERBOARD DEVICES & SPOOLER</span>
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
            activeTab === 'network' 
              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Wifi size={14} />
          <span>NETWORK ADAPTER DIAGNOSTICS</span>
        </button>
      </div>

      {activeTab === 'devices' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
          
          {/* Main motherboard devices list */}
          <div className="xl:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Cpu className="text-violet-400" size={18} />
              <span>Motherboard Controller Hub (Core IRQ Allocation)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase text-[9px] tracking-wider">
                    <th className="py-2 px-3">Device Name</th>
                    <th className="py-2 px-3">IRQ line</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Diagnostics / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/50">
                  {devices.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/10">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {d.category === 'processor' && <Cpu size={14} className="text-amber-400" />}
                          {d.category === 'storage' && <HardDrive size={14} className="text-violet-400" />}
                          {d.category === 'network' && <Radio size={14} className="text-blue-400" />}
                          {d.category === 'audio' && <Volume2 size={14} className="text-emerald-400" />}
                          <div>
                            <span className="font-bold text-slate-200 block">{d.name}</span>
                            <span className="text-[10px] text-slate-400 font-sans leading-none">{d.details}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400">
                          IRQ {d.irq}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.status === 'Active' || d.status === 'Mounted'
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
                            : d.status === 'Idle'
                            ? 'bg-blue-950/40 text-blue-400 border border-blue-800/30'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {d.id === 'nvme0' && (
                          <button
                            onClick={() => handleSmartDiagnostic(d.name)}
                            className="text-violet-400 hover:text-violet-300 hover:underline bg-violet-950/20 px-2 py-1 rounded border border-violet-800/30 text-[10px] font-mono font-bold"
                          >
                            RUN S.M.A.R.T. SCAN
                          </button>
                        )}
                        {d.id === 'usb0' && (
                          <button
                            onClick={toggleUsbMount}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline bg-cyan-950/20 px-2 py-1 rounded border border-cyan-800/30 text-[10px] font-mono font-bold"
                          >
                            {d.status === 'Mounted' ? 'UNMOUNT VOLUME' : 'MOUNT FAT32'}
                          </button>
                        )}
                        {d.id === 'sound0' && (
                          <button
                            onClick={handleAudioTest}
                            className="text-emerald-400 hover:text-emerald-300 hover:underline bg-emerald-950/20 px-2 py-1 rounded border border-emerald-800/30 text-[10px] font-mono font-bold"
                          >
                            EMIT SOUND TONE
                          </button>
                        )}
                        {!['nvme0', 'usb0', 'sound0'].includes(d.id) && (
                          <span className="text-slate-500 italic text-[10px]">Kernel Managed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Print Spooler */}
          <div className="glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-fit space-y-4">
            <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Printer className="text-emerald-400" size={18} />
              <span>OS Printer Spooler Queue</span>
            </h3>

            <form onSubmit={handleAddPrintJob} className="flex gap-2">
              <input
                type="text"
                placeholder="document_to_print.txt"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono font-bold text-xs"
              >
                SPOOL
              </button>
            </form>

            <div className="space-y-3.5 pt-1.5 font-mono text-xs">
              {printerJobs.length === 0 ? (
                <div className="text-center text-slate-500 italic py-6">
                  No active print spooling jobs.
                </div>
              ) : (
                printerJobs.map(job => (
                  <div key={job.id} className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-300 truncate max-w-[140px]">{job.filename}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        job.status === 'Completed' 
                          ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/20'
                          : job.status === 'Printing'
                          ? 'bg-amber-950/40 text-amber-400 border border-amber-800/20 animate-pulse'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          job.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-slate-500">
                      <span>{job.sizeKb} KB</span>
                      <span>Progress: {job.progress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Network diagnostics and ping tool */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
          
          {/* Interface lists */}
          <div className="xl:col-span-1 space-y-6">
            
            {/* Toggle Panel */}
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-4">
              <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Radio className="text-blue-400" size={18} />
                <span>Physical Network Interfaces</span>
              </h3>

              {/* eth0 card */}
              <div className="p-3.5 bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-200">eth0 (Ethernet Adapt)</span>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 font-sans">
                  <div className="flex justify-between"><span>IPv4 Address:</span><span className="text-slate-300 font-mono">192.168.1.45</span></div>
                  <div className="flex justify-between"><span>Hardware MAC:</span><span className="text-slate-300 font-mono">00:1A:2B:3C:4D:5E</span></div>
                  <div className="flex justify-between"><span>MTU size:</span><span className="text-slate-300 font-mono">1500 bytes</span></div>
                </div>
              </div>

              {/* wlan0 card */}
              <div className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex justify-between font-bold items-center">
                  <span className="text-slate-300">wlan0 (Wireless Adapt)</span>
                  <button 
                    onClick={() => setWifiEnabled(!wifiEnabled)}
                    className="text-slate-400 hover:text-white transition-all focus:outline-none"
                  >
                    {wifiEnabled ? (
                      <ToggleRight className="text-emerald-400" size={24} />
                    ) : (
                      <ToggleLeft className="text-slate-600" size={24} />
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 font-sans">
                  <div className="flex justify-between"><span>Status:</span><span className={wifiEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{wifiEnabled ? 'Active' : 'Down / Disabled'}</span></div>
                  {wifiEnabled && (
                    <>
                      <div className="flex justify-between"><span>IPv4 Address:</span><span className="text-slate-300 font-mono">192.168.1.189</span></div>
                      <div className="flex justify-between"><span>Wireless SSID:</span><span className="text-slate-300 font-mono">MiniKernel_Cyber_NET</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Real-time Speeds */}
              <div className="border-t border-slate-800 pt-3 flex justify-between font-mono text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Globe size={13} className="text-blue-400" />
                  <span>RX: <strong className="text-emerald-400">{rxSpeed} KB/s</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowRightLeft size={13} className="text-violet-400" />
                  <span>TX: <strong className="text-violet-400">{txSpeed} KB/s</strong></span>
                </div>
              </div>
            </div>

            {/* Routing Tables */}
            <div className="glassmorphism rounded-2xl border border-slate-800 p-5 space-y-3">
              <h3 className="font-display font-bold text-base text-white border-b border-slate-800 pb-2">
                IPv4 Kernel Routing Cache
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-500">
                      <th className="py-1">Dest</th>
                      <th className="py-1">Gateway</th>
                      <th className="py-1">Flags</th>
                      <th className="py-1">Iface</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routingTable.map((route, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="py-1.5 font-bold">{route.destination}</td>
                        <td className="py-1.5">{route.gateway}</td>
                        <td className="py-1.5 text-slate-400">{route.flags}</td>
                        <td className="py-1.5 text-blue-400">{route.interface}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Interactive Shell Ping Utility */}
          <div className="xl:col-span-2 glassmorphism rounded-2xl border border-slate-800 p-5 flex flex-col h-[400px] overflow-hidden">
            <div className="border-b border-slate-800 pb-3 mb-3 shrink-0 flex justify-between items-center">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Globe className="text-blue-400 animate-pulse" size={18} />
                <span>ICMP Ping Diagnostic Terminal</span>
              </h3>
              <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-lg text-[9px] font-mono border border-emerald-800/30">
                <ShieldCheck size={11} />
                <span>SOCKET_RAW_SOCKET_CAPABLE</span>
              </span>
            </div>

            {/* Target Select / Inputs */}
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. google.com, kernel.org, 127.0.0.1"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  disabled={isPinging}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-blue-500 focus:outline-none rounded-xl pl-3.5 pr-3 py-1.5 text-xs text-slate-200 font-mono disabled:opacity-50"
                />
              </div>
              <button
                onClick={handleTriggerPing}
                disabled={isPinging}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send size={12} />
                <span>PING</span>
              </button>
            </div>

            {/* Terminal screen output */}
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-xl p-3.5 overflow-y-auto font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre select-text">
              {pingLines.length === 0 ? (
                <div className="text-slate-500 italic flex flex-col items-center justify-center h-full gap-2">
                  <Clock size={24} className="opacity-40 animate-pulse" />
                  <span>Enter a destination target and click PING to stream latency response loops.</span>
                </div>
              ) : (
                pingLines.map((line, idx) => (
                  <div key={idx} className={line.includes('time=') ? 'text-blue-300' : line.includes('statistics') ? 'text-amber-300' : 'text-slate-300'}>
                    {line}
                  </div>
                ))
              )}
              <div ref={pingEndRef} />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

"""Build one narrated slide video from tools/video/scripts/<name>.json.

Usage: python3 tools/video/build.py d5
Needs ffmpeg, piper-tts, playwright (with Chromium) and the Piper voice in tools/video/models/.
See docs/video-overviews.md.
"""
import json, sys, os, re, subprocess, wave, html, shutil
from pathlib import Path
BASE = Path(__file__).resolve().parent
from piper import PiperVoice
from playwright.sync_api import sync_playwright

ACCENT = "#818cf8"
VOICE = PiperVoice.load(str(BASE / 'models' / 'vits-piper-en_US-lessac-medium' / 'en_US-lessac-medium.onnx'))
SAY = [(r'\bN10-009\b','N ten dash zero zero nine'),(r'\bIPv4\b','I P version four'),(r'\bIPv6\b','I P version six'),(r'\bIP\b','I P'),(r'\bDNS\b','D N S'),(r'\bDHCP\b','D H C P'),(r'\bVLANs\b','V LANs'),(r'\bVLAN\b','V LAN'),(r'\bSSID\b','S S I D'),(r'\bOSI\b','O S I'),(r'\bSFP\b','S F P'),(r'\bMTU\b','M T U'),(r'\bTTL\b','T T L'),(r'\bACLs?\b','A C L'),(r'\bARP\b','A R P'),(r'\bICMP\b','I C M P'),(r'\bAPIPA\b','A P I P A'),(r'\bSTP\b','S T P'),(r'\bCRC\b','C R C'),(r'\bBPDU\b','B P D U'),(r'\bPoE\b','Power over Ethernet'),(r'\bQoS\b','Q o S'),(r'\bSNMP\b','S N M P'),(r'\bLLDP\b','L L D P'),(r'\bCDP\b','C D P'),(r'\bOTDR\b','O T D R'),(r'\bEMI\b','E M I'),(r'\bRSSI\b','R S S I'),(r'\bAP\b','A P'),(r'\bLAN\b','LAN'),(r'\bTCP\b','T C P'),(r'\bUDP\b','U D P'),(r'\bVPN\b','V P N'),(r'\bNAT\b','nat'),(r'\bCat 5e\b','Cat five E'),(r'\bMAC\b','mac'),(r'\bGHz\b','gigahertz'),(r'\bMbps\b','megabits per second'),(r'\bGbps\b','gigabits per second'),(r'\bsubnet\b','subnet'),(r'\bnslookup\b','N S lookup'),(r'\bdig\b','dig'),(r'\btcpdump\b','T C P dump'),(r'\bnmap\b','N map'),(r'\bnetstat\b','net stat'),(r'\btracert\b','trace R T'),(r'\bipconfig\b','I P config')]
SAY += [(r'\bSDN\b','S D N'),(r'\bSD-WAN\b','S D WAN'),(r'\bVXLAN\b','V X LAN'),(r'\bRPO\b','R P O'),(r'\bRTO\b','R T O'),(r'\bMFA\b','M F A'),(r'\bSSO\b','S S O'),(r'\bSIEM\b','S I E M'),(r'\bNTP\b','N T P'),(r'\bPTP\b','P T P'),(r'\bNTS\b','N T S'),(r'\bLACP\b','L A C P'),(r'\bOSPF\b','O S P F'),(r'\bEIGRP\b','E I G R P'),(r'\bBGP\b','B G P'),(r'\bRIP\b','R I P'),(r'\bSLAAC\b','slack'),(r'\bNAT64\b','nat sixty-four'),(r'TACACS\+','tack axe plus'),(r'\bSAML\b','sam el'),(r'\bDDoS\b','D Dose'),(r'\bDoS\b','dose'),(r'\bFHRP\b','F H R P'),(r'\bIDS\b','I D S'),(r'\bIPS\b','I P S'),(r'\bCIA\b','C I A'),(r'\bDMZ\b','D M Z'),(r'\bPKI\b','P K I'),(r'\bSASE\b','sassy'),(r'\bICS\b','I C S'),(r'\bOT\b','O T'),(r'\bUPS\b','U P S'),(r'\bPDU\b','P D U'),(r'\bMDF\b','M D F'),(r'\bIDF\b','I D F'),(r'\bFTP\b','F T P'),(r'\bSFTP\b','S F T P'),(r'\bSSH\b','S S H'),(r'\bHTTPS\b','H T T P S'),(r'\bHTTP\b','H T T P'),(r'\bSMTP\b','S M T P'),(r'\bPOP3\b','pop three'),(r'\bIMAP\b','I map'),(r'\bTFTP\b','T F T P'),(r'\bSMB\b','S M B'),(r'\bRDP\b','R D P'),(r'\bLDAPS\b','L D A P S'),(r'\bLDAP\b','L D A P'),(r'\bSIP\b','S I P'),(r'\bWPA2\b','W P A two'),(r'\bWPA3\b','W P A three'),(r'\bMIMO\b','mimo'),(r'\bSAN\b','S A N'),(r'\bNAS\b','N A S'),(r'\bIaaS\b','I a a S'),(r'\bPaaS\b','pass'),(r'\bSaaS\b','sass'),(r'\bVPC\b','V P C'),(r'\bCIDR\b','cider'),(r'\bVLSM\b','V L S M'),(r'\bIaC\b','I a C'),(r'\bRADIUS\b','radius'),(r'\bNAC\b','N A C'),(r'\bSPAN\b','span'),(r'\bAAA\b','triple A'),(r'\bPTR\b','P T R'),(r'\bSRV\b','S R V'),(r'\bMX\b','M X'),(r'\bTXT\b','T X T'),(r'\bNS\b','N S'),(r'\bAAAA\b','quad A'),(r'\bCNAME\b','C name'),(r'\bDoH\b','D o H'),(r'\bDoT\b','D o T'),(r'\bDNSSEC\b','D N S sec'),(r'\bSOC\b','sock'),(r'\bRFC\b','R F C'),(r'\bGUI\b','gooey'),(r'\bAPI\b','A P I'),(r'\bMIB\b','M I B'),(r'\bOID\b','O I D'),(r'\bIPAM\b','I P A M'),(r'\bSLA\b','S L A'),(r'\bMTTR\b','M T T R'),(r'\bMTBF\b','M T B F'),(r'\bKVM\b','K V M'),(r'\bNIC\b','nick'),(r'\bSSL\b','S S L'),(r'\bTLS\b','T L S'),(r'\bIPsec\b','I P sec'),(r'\bPAT\b','P A T'),(r'\bSNAT\b','S nat'),(r'\bDNAT\b','D nat'),(r'\bGRE\b','G R E'),(r'\bAES\b','A E S'),(r'\bCCMP\b','C C M P'),(r'\bSAE\b','S A E'),(r'\bWAN\b','wan'),(r'\bMAN\b','man'),(r'\bWLAN\b','W LAN'),(r'\bPAN\b','pan'),(r'\bCAN\b','C A N'),(r'\bAFAP\b','A F A P')]
SAY.sort(key=lambda x:-len(x[0]))
def spoken(t):
    for a,b in SAY: t=re.sub(a,b,t)
    return t

CSS = f"""
*{{box-sizing:border-box;margin:0}}
body{{width:1280px;height:720px;background:#0b1220;color:#f1f5f9;font-family:Inter,'DejaVu Sans',sans-serif;position:relative;overflow:hidden}}
.glow{{position:absolute;right:-120px;top:-160px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,rgba(129,140,248,.22),transparent 65%)}}
.tag{{position:absolute;left:64px;top:40px;font:600 20px 'DejaVu Sans Mono',monospace;color:{ACCENT};letter-spacing:.04em}}
h1{{position:absolute;left:64px;top:84px;right:64px;font-size:46px;font-weight:700;line-height:1.15}}
.body{{position:absolute;left:64px;right:64px;top:176px;bottom:70px}}
ul{{list-style:none;padding:0}} li.b{{font-size:31px;line-height:1.3;padding:10px 0 10px 40px;position:relative;color:#e2e8f0}}
li.b:before{{content:'';position:absolute;left:6px;top:24px;width:14px;height:14px;border-radius:50%;background:{ACCENT}}}
table{{width:100%;border-collapse:collapse;font-size:25px}} th{{text-align:left;color:{ACCENT};font-size:21px;letter-spacing:.06em;text-transform:uppercase;padding:8px 14px;border-bottom:2px solid #34465f}}
td{{padding:11px 14px;border-bottom:1px solid #243248;vertical-align:top;color:#e2e8f0}} td:first-child{{font-weight:600;color:#fff;width:34%}}
.steps{{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}} .step{{background:#152238;border:1px solid #34465f;border-radius:16px;padding:18px 20px;min-height:150px}}
.step b{{display:block;color:{ACCENT};font:700 22px 'DejaVu Sans Mono',monospace}} .step span{{display:block;margin-top:6px;font-size:26px;font-weight:600}} .step i{{display:block;font-style:normal;margin-top:6px;font-size:19px;color:#b8c5d6;line-height:1.3}}
.big{{font-size:30px;color:#b8c5d6;margin-top:18px;line-height:1.4}}
.callout{{margin-top:22px;border:1px solid {ACCENT};background:rgba(129,140,248,.1);border-radius:14px;padding:16px 22px;font-size:26px;color:#e0e7ff}}
.bar{{position:absolute;left:0;bottom:0;height:8px;background:{ACCENT}}}
.title h1{{position:static;font-size:64px;margin-top:150px;padding:0 64px}} .title .sub{{padding:18px 64px;font-size:30px;color:#b8c5d6}}
"""
def slide_html(s, idx, n, dom):
    e=html.escape
    k=s['kind']
    if k=='title':
        body=f"<div class='title'><h1>{e(s['title'])}</h1><div class='sub'>{e(s.get('sub',''))}</div></div>"
        head=f"<div class='tag'>{e(dom['tag'])}</div>"
        return f"<style>{CSS}</style><div class='glow'></div>{head}{body}<div class='bar' style='width:{100*(idx+1)/n:.1f}%'></div>"
    if k=='bullets': c="<ul>"+"".join(f"<li class='b'>{e(x)}</li>" for x in s['items'])+"</ul>"
    elif k=='table': c="<table><tr>"+"".join(f"<th>{e(h)}</th>" for h in s['head'])+"</tr>"+"".join("<tr>"+"".join(f"<td>{e(x)}</td>" for x in r)+"</tr>" for r in s['rows'])+"</table>"
    elif k=='steps': c="<div class='steps'>"+"".join(f"<div class='step'><b>{i+1}</b><span>{e(a)}</span><i>{e(b)}</i></div>" for i,(a,b) in enumerate(s['steps']))+"</div>"
    else: raise SystemExit('bad kind '+k)
    if s.get('callout'): c+=f"<div class='callout'>{e(s['callout'])}</div>"
    return f"<style>{CSS}</style><div class='glow'></div><div class='tag'>{e(dom['tag'])}</div><h1>{e(s['title'])}</h1><div class='body'>{c}</div><div class='bar' style='width:{100*(idx+1)/n:.1f}%'></div>"

def run(name):
    dom=json.load(open(BASE / 'scripts' / f'{name}.json')); S=dom['slides']; out=str(BASE / 'out' / name); os.makedirs(out,exist_ok=True)
    with sync_playwright() as p:
        b=p.chromium.launch(); pg=b.new_page(viewport={'width':1280,'height':720})
        for i,s in enumerate(S):
            pg.set_content(slide_html(s,i,len(S),dom)); pg.screenshot(path=f'{out}/s{i:02d}.png',type='png')
            ov=pg.evaluate("[...document.querySelectorAll('.body,table,ul,.steps')].some(e=>e.getBoundingClientRect().bottom>655)")
            if ov: print('OVERFLOW slide',i,s['title'])
        b.close()
    tot=0; files=[]
    for i,s in enumerate(S):
        wav=f'{out}/s{i:02d}.wav'
        with wave.open(wav,'wb') as f: VOICE.synthesize_wav(spoken(s['say']),f)
        w=wave.open(wav); d=w.getnframes()/w.getframerate()+0.7; tot+=d
        mp4=f'{out}/s{i:02d}.mp4'; tmp=mp4+'.tmp.mp4'
        subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','30','-i',f'{out}/s{i:02d}.png','-i',wav,'-vf',f'format=yuv420p,loop=-1:1,trim=duration={d:.3f},fade=t=in:st=0:d=0.3','-af','apad','-t',f'{d:.3f}','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-r','30','-c:a','aac','-b:a','160k','-ar','22050','-ac','1',tmp],check=True)
        os.rename(tmp,mp4); files.append(mp4)
    lst=f'{out}/list.txt'; open(lst,'w').write(''.join(f"file '{f}'\n" for f in files))
    final=str(BASE / 'out' / f'{name}.mp4')
    subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',lst,'-c','copy',final+'.tmp.mp4'],check=True); os.rename(final+'.tmp.mp4',final)
    print(name,'slides',len(S),'minutes',round(tot/60,2),'words',sum(len(s['say'].split()) for s in S))
if __name__=='__main__': run(sys.argv[1])

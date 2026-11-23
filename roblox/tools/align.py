import sherpa_onnx, soundfile as sf, numpy as np, json, difflib, re
d='/home/claude/asr/sherpa-onnx-zipformer-en-2023-06-26/'
r=sherpa_onnx.OfflineRecognizer.from_transducer(encoder=d+'encoder-epoch-99-avg-1.int8.onnx',decoder=d+'decoder-epoch-99-avg-1.int8.onnx',joiner=d+'joiner-epoch-99-avg-1.int8.onnx',tokens=d+'tokens.txt',num_threads=2)
a,sr=sf.read('/tmp/v16.wav',dtype='float32'); A=[]; CH=20*sr; pos=0
while pos<len(a):
    end=min(len(a),pos+CH)
    if end<len(a):
        w=a[end-3*sr:end]; e=np.convolve(np.abs(w),np.ones(1600)/1600,'same'); end=end-3*sr+int(e.argmin())
    s=r.create_stream(); s.accept_waveform(sr,a[pos:end]); r.decode_stream(s); res=s.result; cur="";st=0
    for tok,t in zip(res.tokens,res.timestamps):
        if tok.startswith("▁") or tok.startswith(" "):
            if cur: A.append([st,cur])
            cur=tok.strip("▁ ");st=t+pos/sr
        else:
            if not cur: st=t+pos/sr
            cur+=tok
    if cur: A.append([st,cur])
    pos=end
dur=len(a)/sr
text=json.load(open('story.json'))["paragraphs"][0]["text"]
S=text.split(); n=lambda w:re.sub(r"[^a-z']","",w.lower())
sm=difflib.SequenceMatcher(None,[n(w) for w in S],[n(w) for _,w in A],autojunk=False)
t=[None]*len(S)
for i,j,k in sm.get_matching_blocks():
    for q in range(k): t[i+q]=A[j+q][0]
print("matched",sum(x is not None for x in t),"of",len(S),"dur",round(dur,1),"wpm",round(len(S)/dur*60))
known=[(i,x) for i,x in enumerate(t) if x is not None]
if known[0][0]>0: known=[(0,max(0,known[0][1]-0.3*known[0][0]))]+known
if known[-1][0]<len(S)-1: known.append((len(S)-1,dur-0.4))
for (i0,x0),(i1,x1) in zip(known,known[1:]):
    for i in range(i0,i1+1): t[i]=x0+(x1-x0)*(i-i0)/max(1,i1-i0)
words=[[round(max(0,t[i]-0.04),3),round(min(t[i+1]-0.02 if i+1<len(S) else dur-0.15,t[i]+0.5),3),S[i]] for i in range(len(S))]
json.dump({"file":"p01.wav","text":text,"words":words,"keep":round(dur,3)},open("vo/p01.json","w"),indent=1)

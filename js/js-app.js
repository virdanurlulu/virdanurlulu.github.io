    let simulationLog = []; // Make simulationLog globally accessible for better module interaction
    let updatePsVsZeChart = () => {}; // Define a placeholder function in a shared scope

    // Global utility functions
    function debounce(func, delay = 250) {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
      };
    }

    function parseNumberLoose(s){
      if (s==null) return NaN;
      s = String(s).trim().replace(/\s+/g,'').replace(/\u00A0/g,'');
      if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g,'').replace(',', '.');
      else if (/^\d+,\d+$/.test(s)) s = s.replace(',', '.');
      else s = s.replace(/(?<=\d),(?=\d{3}(?:\D|$))/g, '');
      return Number(s);
    }

    function extractNumbers(line){
      const toks = String(line).match(/-?\d+(?:[.,]\d+)?/g) || [];
      return toks.map(parseNumberLoose).filter(n=>Number.isFinite(n));
    }
    
    function parseData(text){
      const out = [];
      const rows = (text||'').split(/[\r\n]+/).map(r=>r.trim()).filter(Boolean);
      for (const r of rows){
        const nums = extractNumbers(r);
        if (!nums.length) continue;
        const rVal = nums[0];
        const poVal = nums.length>1 ? nums[1] : null;
        if (rVal > 0) out.push({ r: rVal, Po: (poVal!=null && Number.isFinite(poVal)) ? poVal : null });
      }
      out.sort((a,b)=>a.r-b.r);
      return out;
    }

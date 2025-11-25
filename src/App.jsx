import { useState, useRef, useEffect } from "react";
import { Calculator, Target, TrendingUp, Info } from "lucide-react";

function DrillingCalculator() {
  const [wellType, setWellType] = useState("");
  const [inputs, setInputs] = useState({
    V_B: "",
    V_t: "",
    H_t: "",
    BUR: "",
    // extra inputs from HTML file
    Es: "",
    Ns: "",
    Et: "",
    Nt: "",
    DOR: "",
    Ve: "",
    alpha2Deg: "",
  });

  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  // ---- Helpers ----
  const deg2rad = (deg) => (deg * Math.PI) / 180;
  const rad2deg = (rad) => (rad * 180) / Math.PI;

  const getNumber = (key) => {
    const v = inputs[key];
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleInputChange = (e) => {
    setInputs((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const resetForm = () => {
    setInputs({
      V_B: "",
      V_t: "",
      H_t: "",
      BUR: "",
      Es: "",
      Ns: "",
      Et: "",
      Nt: "",
      DOR: "",
      Ve: "",
      alpha2Deg: "",
    });
    setResults(null);
    setError("");
  };

  // ---- TYPE 1: Keep your existing logic (only extended to add points/infoText) ----
  const calculateTypeI = () => {
    const V_B = parseFloat(inputs.V_B);
    const V_t = parseFloat(inputs.V_t);
    const H_t = parseFloat(inputs.H_t);
    const BUR = parseFloat(inputs.BUR);

    if (isNaN(V_B) || isNaN(V_t) || isNaN(H_t) || isNaN(BUR)) {
      alert("Please enter all values");
      return;
    }

    if (V_B < 0 || V_t < 0 || H_t < 0 || BUR <= 0) {
      alert("Please enter valid positive values");
      return;
    }

    if (V_t <= V_B) {
      alert("Target depth (V_t) must be greater than KOP depth (V_B)");
      return;
    }

    const R = (180 * 100) / (Math.PI * BUR);
    const x = Math.atan((H_t - R) / (V_t - V_B));
    const alpha = x + Math.asin((R * Math.cos(x)) / (V_t - V_B));
    const alphaDeg = (alpha * 180) / Math.PI;
    const xDeg = (x * 180) / Math.PI;

    const V_A = 0;
    const H_A = 0;
    const MD_A = 0;
    const H_B = 0;
    const MD_B = V_B;
    const V_c = V_B + R * Math.sin(alpha);
    const H_c = R * (1 - Math.cos(alpha));
    const MD_c = MD_B + (alphaDeg * 100) / BUR;
    const MD_t = MD_c + (V_t - V_c) / Math.cos(alpha);

    // Build points for plotting (A,B,C,T) – logic uses your original formulas
    const A = { name: "A", V: V_A, H: H_A, MD: MD_A };
    const B = {
      name: "B",
      V: V_B,
      H: H_B,
      MD: MD_B,
      arc: { R, startDeg: 0, endDeg: alphaDeg, type: "build" },
    };
    const C = { name: "C", V: V_c, H: H_c, MD: MD_c };
    const T = { name: "T", V: V_t, H: H_t, MD: MD_t };

    setResults({
      type: "type1",
      R: R.toFixed(2),
      x: xDeg.toFixed(2),
      alpha: alphaDeg.toFixed(2),
      pointA: { V: V_A.toFixed(2), H: H_A.toFixed(2), MD: MD_A.toFixed(2) },
      pointB: { V: V_B.toFixed(2), H: H_B.toFixed(2), MD: MD_B.toFixed(2) },
      pointC: { V: V_c.toFixed(2), H: H_c.toFixed(2), MD: MD_c.toFixed(2) },
      pointT: { V: V_t.toFixed(2), H: H_t.toFixed(2), MD: MD_t.toFixed(2) },
      points: [A, B, C, T],
      infoText: `Type I | R ≈ ${R.toFixed(2)} ft, α ≈ ${alphaDeg.toFixed(
        2
      )}°`,
    });
    setError("");
  };

  // ---- TYPE 2: Build + Drop (from HTML computeType2) ----
  const calculateTypeII = () => {
    const Es = getNumber("Es");
    const Ns = getNumber("Ns");
    const Et = getNumber("Et");
    const Nt = getNumber("Nt");
    const Vt = getNumber("V_t");
    const Vb = getNumber("V_B");
    const BUR = getNumber("BUR");
    const DOR = getNumber("DOR");
    const Ve = getNumber("Ve");
    const alpha2Deg = getNumber("alpha2Deg");
    const HtInput = getNumber("H_t");

    if ([Vt, Vb, BUR, DOR, Ve, alpha2Deg].some((v) => v === null))
      throw new Error("Type 2: Please fill Vt, Vb, BUR, DOR, Ve and α₂.");

    if (BUR <= 0 || DOR <= 0)
      throw new Error("BUR and DOR must be positive.");

    let Ht;
    if (HtInput !== null) {
      Ht = HtInput;
    } else {
      if ([Es, Ns, Et, Nt].some((v) => v === null))
        throw new Error(
          "Type 2: Please provide Target Displacement Ht OR all Coordinates (Es, Ns, Et, Nt)."
        );
      Ht = Math.sqrt(Math.pow(Nt - Ns, 2) + Math.pow(Et - Es, 2));
    }

    const R1 = (180 * 100) / (Math.PI * BUR);
    const R2 = (180 * 100) / (Math.PI * DOR);
    const alpha2Rad = deg2rad(alpha2Deg);

    const OQ =
      Ht - R1 - R2 * Math.cos(alpha2Rad) - (Vt - Ve) * Math.tan(alpha2Rad);
    const OP = Ve - Vb + R2 * Math.sin(alpha2Rad);

    const xRad = Math.atan2(OQ, OP);
    const QF = R1 + R2;
    const PQ = Math.sqrt(OP * OP + OQ * OQ);
    const PF = Math.sqrt(Math.max(PQ * PQ - QF * QF, 0));

    const yRad = Math.atan2(QF, PF);
    const alpha1Rad = xRad + yRad;
    const alpha1Deg = rad2deg(alpha1Rad);
    const CD = PF;

    const S = { name: "S", V: 0, H: 0, MD: 0 };
    const B = {
      name: "B",
      V: Vb,
      H: 0,
      MD: Vb,
      arc: { R: R1, startDeg: 0, endDeg: alpha1Deg, type: "build" },
    };

    const Vc = Vb + R1 * Math.sin(alpha1Rad);
    const Hc = R1 * (1 - Math.cos(alpha1Rad));
    const MDc = B.MD + (alpha1Deg * 100) / BUR;
    const C = { name: "C", V: Vc, H: Hc, MD: MDc };

    const Vd = Vc + CD * Math.cos(alpha1Rad);
    const Hd = Hc + CD * Math.sin(alpha1Rad);
    const MDd = MDc + CD;
    const D = {
      name: "D",
      V: Vd,
      H: Hd,
      MD: MDd,
      arc: { R: R2, startDeg: alpha1Deg, endDeg: alpha2Deg, type: "drop" },
    };

    const VeFinal = Ve;
    const He = Hd + R2 * (Math.cos(alpha2Rad) - Math.cos(alpha1Rad));
    const MDe = MDd + (100 * (alpha2Deg - alpha1Deg)) / DOR;
    const Ept = { name: "E", V: VeFinal, H: He, MD: MDe };

    const MDt = MDe + (Vt - VeFinal) / Math.cos(alpha2Rad);
    const T = { name: "T", V: Vt, H: Ht, MD: MDt };

    setResults({
      type: "type2",
      points: [S, B, C, D, Ept, T],
      infoText: `Type II | Ht ≈ ${Ht.toFixed(2)} ft, R₁ ≈ ${R1.toFixed(
        2
      )} ft, R₂ ≈ ${R2.toFixed(2)} ft, α₁ ≈ ${alpha1Deg.toFixed(
        2
      )}°, α₂ = ${alpha2Deg.toFixed(2)}°`,
    });
    setError("");
  };

  // ---- TYPE 3: Build & Hold (from HTML computeType3) ----
  const calculateTypeIII = () => {
    const Vt = getNumber("V_t");
    const Vb = getNumber("V_B");
    const BUR = getNumber("BUR");
    const alpha2DegInput = getNumber("alpha2Deg");
    const HtInput = getNumber("H_t");

    const Es = getNumber("Es");
    const Ns = getNumber("Ns");
    const Et = getNumber("Et");
    const Nt = getNumber("Nt");

    let Ht = HtInput;
    if (
      Ht === null &&
      Es !== null &&
      Ns !== null &&
      Et !== null &&
      Nt !== null
    ) {
      Ht = Math.sqrt(Math.pow(Nt - Ns, 2) + Math.pow(Et - Es, 2));
    }

    if (Vt === null)
      throw new Error("Type 3: Target TVD (Vt) is required for all cases.");

    let caseName = "";
    let R,
      calcAlpha2Deg,
      calcVb,
      calcHt,
      calcBUR;

    // Case 1: Vt, Ht, Vb
    if (Ht !== null && Vb !== null && BUR === null && alpha2DegInput === null) {
      caseName = "Case 1 (Vt, Ht, Vb)";
      if (Vt <= Vb) throw new Error("Type 3 Case 1: Vt must be > Vb.");

      const deltaV = Vt - Vb;
      const alpha2Rad = 2 * Math.atan(Ht / deltaV);
      calcAlpha2Deg = rad2deg(alpha2Rad);

      R = deltaV / Math.sin(alpha2Rad);
      calcBUR = (180 * 100) / (Math.PI * R);

      calcVb = Vb;
      calcHt = Ht;

      // Case 2: Vt, Ht, BUR
    } else if (
      Ht !== null &&
      BUR !== null &&
      Vb === null &&
      alpha2DegInput === null
    ) {
      caseName = "Case 2 (Vt, Ht, BUR)";
      if (BUR <= 0) throw new Error("BUR must be positive.");

      R = (180 * 100) / (Math.PI * BUR);

      const cosAlpha2 = (R - Ht) / R;
      if (cosAlpha2 < -1 || cosAlpha2 > 1)
        throw new Error(
          "Type 3 Case 2: Invalid geometry. Check Vt/Ht/BUR inputs."
        );

      const alpha2Rad = Math.acos(cosAlpha2);
      calcAlpha2Deg = rad2deg(alpha2Rad);

      calcVb = Vt - R * Math.sin(alpha2Rad);
      calcHt = Ht;
      calcBUR = BUR;

      // Case 3: Vt, Ht, α₂
    } else if (
      Ht !== null &&
      alpha2DegInput !== null &&
      Vb === null &&
      BUR === null
    ) {
      caseName = "Case 3 (Vt, Ht, α₂)";
      const alpha2Rad = deg2rad(alpha2DegInput);
      if (alpha2Rad <= 0) throw new Error("α₂ must be positive.");

      R = Ht / (1 - Math.cos(alpha2Rad));

      calcVb = Vt - R * Math.sin(alpha2Rad);
      calcBUR = (180 * 100) / (Math.PI * R);
      calcHt = Ht;
      calcAlpha2Deg = alpha2DegInput;

      // Case 4: Vt, Vb, α₂
    } else if (
      Vb !== null &&
      alpha2DegInput !== null &&
      Ht === null &&
      BUR === null
    ) {
      caseName = "Case 4 (Vt, Vb, α₂)";
      if (Vt <= Vb) throw new Error("Type 3 Case 4: Vt must be > Vb.");

      const alpha2Rad = deg2rad(alpha2DegInput);
      if (alpha2Rad <= 0) throw new Error("α₂ must be positive.");

      R = (Vt - Vb) / Math.sin(alpha2Rad);

      calcHt = R * (1 - Math.cos(alpha2Rad));
      calcBUR = (180 * 100) / (Math.PI * R);
      calcVb = Vb;
      calcAlpha2Deg = alpha2DegInput;
    } else {
      throw new Error(
        "Type 3: Please provide exactly one of these combinations:\n" +
        "1) Vt, Ht, Vb\n" +
        "2) Vt, Ht, BUR\n" +
        "3) Vt, Ht, α₂\n" +
        "4) Vt, Vb, α₂"
      );
    }

    const alpha2Rad = deg2rad(calcAlpha2Deg);

    const S = { name: "S", V: 0, H: 0, MD: 0 };
    const B = {
      name: "B",
      V: calcVb,
      H: 0,
      MD: calcVb,
      arc: { R, startDeg: 0, endDeg: calcAlpha2Deg, type: "build" },
    };

    const VtCalc = calcVb + R * Math.sin(alpha2Rad);
    const HtCalc = R * (1 - Math.cos(alpha2Rad));
    const MDt = B.MD + (calcAlpha2Deg * 100) / calcBUR;

    const T = { name: "T", V: VtCalc, H: HtCalc, MD: MDt };

    setResults({
      type: "type3",
      points: [S, B, T],
      infoText: `Type III | ${caseName}. R ≈ ${R.toFixed(
        2
      )} ft, α₂ ≈ ${calcAlpha2Deg.toFixed(2)}°, BUR ≈ ${calcBUR.toFixed(
        3
      )} deg/100 ft.`,
    });
    setError("");
  };

  // ---- Calculate dispatcher ----
  const handleCalculate = () => {
    try {
      if (wellType === "type1") {
        calculateTypeI();
      } else if (wellType === "type2") {
        calculateTypeII();
      } else if (wellType === "type3") {
        calculateTypeIII();
      } else {
        alert("Please select a well type");
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "An error occurred during calculation.");
    }
  };

  // ---- Canvas drawing (React version of drawGraph) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !results?.points || results.points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeAndDraw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;
      const margin = 40;

      ctx.clearRect(0, 0, width, height);

      let minH = Infinity,
        maxH = -Infinity,
        minV = Infinity,
        maxV = -Infinity;

      results.points.forEach((p) => {
        if (p.H < minH) minH = p.H;
        if (p.H > maxH) maxH = p.H;
        if (p.V < minV) minV = p.V;
        if (p.V > maxV) maxV = p.V;
      });

      if (minH === maxH) {
        minH -= 1;
        maxH += 1;
      }
      if (minV === maxV) {
        minV -= 1;
        maxV += 1;
      }

      const dataWidth = maxH - minH;
      const dataHeight = maxV - minV;
      const plotWidth = width - 2 * margin;
      const plotHeight = height - 2 * margin;
      const dataScale = Math.min(plotWidth / dataWidth, plotHeight / dataHeight);

      const toCanvas = (p) => {
        const x = margin + (p.H - minH) * dataScale;
        const y = margin + (p.V - minV) * dataScale;
        return { x, y };
      };

      // axes
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#6b7280";
      ctx.beginPath();
      ctx.moveTo(margin, margin);
      ctx.lineTo(margin, height - margin);
      ctx.moveTo(margin, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.stroke();

      ctx.fillStyle = "#9ca3af";
      ctx.font = "10px system-ui";
      ctx.fillText("V (TVD, ft)", margin + 4, margin + 10);
      ctx.fillText("H (HD, ft)", width - margin - 35, height - margin + 12);

      // ticks X
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const Hval = minH + frac * (maxH - minH);
        const x = margin + (Hval - minH) * dataScale;
        ctx.beginPath();
        ctx.moveTo(x, height - margin);
        ctx.lineTo(x, height - margin + 4);
        ctx.strokeStyle = "#374151";
        ctx.stroke();
        ctx.fillText(Hval.toFixed(1), x, height - margin + 14);
      }

      // ticks Y
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= 4; i++) {
        const frac = i / 4;
        const Vval = minV + frac * (maxV - minV);
        const y = margin + (Vval - minV) * dataScale;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin - 4, y);
        ctx.strokeStyle = "#374151";
        ctx.stroke();
        ctx.fillText(Vval.toFixed(1), margin - 6, y);
      }

      // path
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#22c55e";
      ctx.beginPath();

      results.points.forEach((p, idx) => {
        if (idx === 0) {
          const { x, y } = toCanvas(p);
          ctx.moveTo(x, y);
          return;
        }

        const prev = results.points[idx - 1];
        if (prev.arc) {
          const { R, startDeg, endDeg, type } = prev.arc;
          const steps = 20;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const currentDeg = startDeg + t * (endDeg - startDeg);
            const currentRad = deg2rad(currentDeg);
            const startRad = deg2rad(startDeg);

            let H_interp, V_interp;
            if (type === "build") {
              H_interp = prev.H + R * (Math.cos(startRad) - Math.cos(currentRad));
              V_interp = prev.V + R * (Math.sin(currentRad) - Math.sin(startRad));
            } else {
              H_interp = prev.H + R * (Math.cos(currentRad) - Math.cos(startRad));
              V_interp = prev.V + R * (Math.sin(startRad) - Math.sin(currentRad));
            }

            const pt = toCanvas({ H: H_interp, V: V_interp });
            ctx.lineTo(pt.x, pt.y);
          }
          const { x, y } = toCanvas(p);
          ctx.lineTo(x, y);
        } else {
          const { x, y } = toCanvas(p);
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // points
      results.points.forEach((p) => {
        const { x, y } = toCanvas(p);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#0ea5e9";
        ctx.fill();

        ctx.fillStyle = "#e5e7eb";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.font = "11px system-ui";
        ctx.fillText(p.name, x + 6, y - 3);
      });
    };

    resizeAndDraw();
    window.addEventListener("resize", resizeAndDraw);
    return () => window.removeEventListener("resize", resizeAndDraw);
  }, [results]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Directional Well Calculator
                </h1>
                <p className="text-gray-600 mt-1">
                  Advanced trajectory planning for drilling operations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Well Type Selection */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Select Well Profile
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "type1", label: "Type I Well", subtitle: "Build & Hold Profile", badge: "I" },
              { key: "type2", label: "Type II Well", subtitle: "Build + Drop", badge: "II" },
              { key: "type3", label: "Type III Well", subtitle: "Build & Hold (Geometric)", badge: "III" },
              { key: "type4", label: "Type IV Well", subtitle: "Coming Soon", badge: "IV", disabled: true },
            ].map((t) => {
              const isActive = wellType === t.key;
              const isDisabled = t.disabled;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    if (isDisabled) return;
                    setWellType(t.key);
                    setResults(null);
                    setError("");
                  }}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${isDisabled
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                      : isActive
                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105"
                        : "border-gray-200 hover:border-blue-400 hover:shadow-md bg-white"
                    }`}
                  disabled={isDisabled}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isActive && !isDisabled
                          ? "bg-blue-600"
                          : "bg-gray-200 group-hover:bg-blue-100"
                        }`}
                    >
                      <span
                        className={`text-xl font-bold ${isActive && !isDisabled
                            ? "text-white"
                            : "text-gray-600 group-hover:text-blue-600"
                          }`}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <div
                      className={`font-bold text-lg mb-1 ${isActive && !isDisabled ? "text-blue-700" : "text-gray-800"
                        }`}
                    >
                      {t.label}
                    </div>
                    <div className="text-sm text-gray-600">{t.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {wellType && (
            <p className="mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              {wellType === "type1" &&
                "Type I: Uses V_B, V_t, H_t and BUR (your original Type I logic)."}
              {wellType === "type2" &&
                "Type II: Build + Drop using Vt, Vb, BUR, DOR, Ve and optional Ht / coordinates."}
              {wellType === "type3" &&
                "Type III: Build & hold using one of the geometric combinations (Vt with Ht/Vb/BUR/α₂)."}
            </p>
          )}
        </div>

        {/* Input Form – core parameters (Type I-compatible) */}
        {wellType && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">
                  Input Parameters
                </h2>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">
                    Common Parameters
                  </p>
                  <p>
                    All depths in feet (ft), angles in degrees, rates in deg/100 ft.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "V_B", label: "Vertical Depth at KOP (V_B)", unit: "ft", placeholder: "e.g., 1000" },
                  { key: "V_t", label: "True Vertical Depth (V_t)", unit: "ft", placeholder: "e.g., 5000" },
                  { key: "H_t", label: "Horizontal Displacement (H_t)", unit: "ft", placeholder: "e.g., 3000" },
                  { key: "BUR", label: "Build Up Rate (BUR)", unit: "°/100ft", placeholder: "e.g., 2" },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {field.label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name={field.key}
                        value={inputs[field.key]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder={field.placeholder}
                      />
                      <span className="absolute right-4 top-3.5 text-gray-500 text-sm font-medium">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced geometric parameters for Type II / Type III */}
            {(wellType === "type2" || wellType === "type3") && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Advanced Geometrical Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { key: "Es", label: "Surface Coordinate (Es)", unit: "ft" },
                    { key: "Ns", label: "Surface Coordinate (Ns)", unit: "ft" },
                    { key: "Et", label: "Target Coordinate (Et)", unit: "ft" },
                    { key: "Nt", label: "Target Coordinate (Nt)", unit: "ft" },
                    wellType === "type2" && {
                      key: "DOR",
                      label: "Drop-off rate (DOR)",
                      unit: "°/100ft",
                    },
                    wellType === "type2" && {
                      key: "Ve",
                      label: "TVD at End of Drop (Ve)",
                      unit: "ft",
                    },
                    (wellType === "type2" || wellType === "type3") && {
                      key: "alpha2Deg",
                      label: "Final inclination α₂",
                      unit: "°",
                    },
                  ]
                    .filter(Boolean)
                    .map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            name={field.key}
                            value={inputs[field.key]}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder=""
                          />
                          <span className="absolute right-4 top-3.5 text-gray-500 text-sm font-medium">
                            {field.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Tip: For Type III, only certain combinations are valid (Vt with Ht/Vb/BUR/α₂). Check error messages for guidance.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={handleCalculate}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Calculate Trajectory
              </button>
              <button
                onClick={resetForm}
                className="sm:w-32 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Reset
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            {/* Your original Type I summary UI */}
            {results.type === "type1" && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Calculation Results
                </h2>

                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-indigo-900 mb-4 text-lg">
                    Intermediate Calculations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: "Radius (R)", value: results.R, unit: "feet" },
                      { label: "x value", value: results.x, unit: "degrees" },
                      {
                        label: "Build Angle (α)",
                        value: results.alpha,
                        unit: "degrees",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="bg-white/80 rounded-lg p-4 shadow-sm"
                      >
                        <div className="text-sm text-gray-600 mb-1">
                          {item.label}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {item.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 mb-4 text-lg">
                  Well Trajectory Points
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      point: "A",
                      name: "Surface",
                      data: results.pointA,
                      bgColor: "from-gray-50 to-white",
                      borderColor: "border-gray-200",
                    },
                    {
                      point: "B",
                      name: "Kickoff Point (KOP)",
                      data: results.pointB,
                      bgColor: "from-blue-50 to-white",
                      borderColor: "border-blue-300",
                    },
                    {
                      point: "C",
                      name: "End of Build",
                      data: results.pointC,
                      bgColor: "from-green-50 to-white",
                      borderColor: "border-green-300",
                    },
                    {
                      point: "T",
                      name: "Target",
                      data: results.pointT,
                      bgColor: "from-purple-50 to-white",
                      borderColor: "border-purple-300",
                    },
                  ].map((item) => (
                    <div
                      key={item.point}
                      className={`border-2 ${item.borderColor} rounded-xl p-5 bg-gradient-to-br ${item.bgColor} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-sm">
                          {item.point}
                        </div>
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                      </div>
                      <div className="space-y-3">
                        {[
                          { label: "Vertical Depth", value: item.data.V },
                          { label: "Horizontal", value: item.data.H },
                          { label: "Measured Depth", value: item.data.MD },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-center"
                          >
                            <span className="text-gray-600 text-sm">
                              {row.label}
                            </span>
                            <span className="font-bold text-gray-900">
                              {row.value} ft
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generic Well Profile (canvas + table) for any type with points */}
            {results.points && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8">
                <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6">
                  {/* Graph */}
                  <div className="lg:col-span-3 flex flex-col gap-3">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">
                          Well Path Profile
                        </h2>
                        <p className="text-xs text-gray-500">
                          x-axis: Horizontal Displacement (ft), y-axis: TVD (ft)
                        </p>
                      </div>
                      {results.infoText && (
                        <span className="inline-flex text-xs px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                          {results.infoText}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-64 md:h-80 rounded-xl border border-slate-200 bg-slate-900/90 overflow-hidden">
                      <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      Computed Points
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Vertical depth (V), Horizontal displacement (H), Measured depth (MD).
                    </p>
                    <div className="max-h-80 overflow-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 border-b text-gray-600">
                              Point
                            </th>
                            <th className="px-3 py-2 border-b text-gray-600">
                              V (ft)
                            </th>
                            <th className="px-3 py-2 border-b text-gray-600">
                              H (ft)
                            </th>
                            <th className="px-3 py-2 border-b text-gray-600">
                              MD (ft)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.points.map((p, idx) => (
                            <tr
                              key={idx}
                              className={idx % 2 === 1 ? "bg-slate-50/60" : ""}
                            >
                              <td className="px-3 py-2 border-b text-center font-semibold">
                                {p.name}
                              </td>
                              <td className="px-3 py-2 border-b text-center">
                                {p.V.toFixed(3)}
                              </td>
                              <td className="px-3 py-2 border-b text-center">
                                {p.H.toFixed(3)}
                              </td>
                              <td className="px-3 py-2 border-b text-center">
                                {p.MD.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mt-6 text-center">
          <p className="text-gray-600">
            Developed by{" "}
            <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Anshika Srivastava
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Directional Drilling Engineering Calculator
          </p>
        </div>
      </div>
    </div>
  );
}

export default DrillingCalculator;

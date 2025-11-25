import { useState } from "react";
import { Calculator, Target, TrendingUp, Info } from "lucide-react";

function DrillingCalculator() {
  const [wellType, setWellType] = useState("");
  const [inputs, setInputs] = useState({
    V_B: "",
    V_t: "",
    H_t: "",
    BUR: "",
  });
  const [results, setResults] = useState(null);

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

    setResults({
      R: R.toFixed(2),
      x: xDeg.toFixed(2),
      alpha: alphaDeg.toFixed(2),
      pointA: { V: V_A.toFixed(2), H: H_A.toFixed(2), MD: MD_A.toFixed(2) },
      pointB: { V: V_B.toFixed(2), H: H_B.toFixed(2), MD: MD_B.toFixed(2) },
      pointC: { V: V_c.toFixed(2), H: H_c.toFixed(2), MD: MD_c.toFixed(2) },
      pointT: { V: V_t.toFixed(2), H: H_t.toFixed(2), MD: MD_t.toFixed(2) },
    });
  };

  const handleInputChange = (e) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value,
    });
  };

  const handleCalculate = () => {
    if (wellType === "type1") {
      calculateTypeI();
    } else {
      alert("Please select Type I Well");
    }
  };

  const resetForm = () => {
    setInputs({
      V_B: "",
      V_t: "",
      H_t: "",
      BUR: "",
    });
    setResults(null);
  };

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
            <button
              onClick={() => {
                setWellType("type1");
                resetForm();
              }}
              className={`group relative p-6 rounded-xl border-2 transition-all duration-300 ${wellType === "type1"
                  ? "border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105"
                  : "border-gray-200 hover:border-blue-400 hover:shadow-md bg-white"
                }`}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${wellType === "type1"
                      ? "bg-blue-600"
                      : "bg-gray-200 group-hover:bg-blue-100"
                    }`}
                >
                  <span
                    className={`text-xl font-bold ${wellType === "type1"
                        ? "text-white"
                        : "text-gray-600 group-hover:text-blue-600"
                      }`}
                  >
                    I
                  </span>
                </div>
                <div
                  className={`font-bold text-lg mb-1 ${wellType === "type1" ? "text-blue-700" : "text-gray-800"
                    }`}
                >
                  Type I Well
                </div>
                <div className="text-sm text-gray-600">Build &amp; Hold Profile</div>
              </div>
            </button>

            {["II", "III", "IV"].map((type) => (
              <button
                key={type}
                disabled
                className="relative p-6 rounded-xl border-2 border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-gray-400">{type}</span>
                  </div>
                  <div className="font-bold text-lg text-gray-500 mb-1">
                    {`Type ${type} Well`}
                  </div>
                  <div className="text-sm text-gray-400">Coming Soon</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        {wellType === "type1" && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Input Parameters</h2>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">
                  Type I Well Profile (Build &amp; Hold)
                </p>
                <p>
                  Enter the known parameters below. All measurements should be in
                  feet (ft) and angles in degrees.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["V_B", "V_t", "H_t", "BUR"].map((field) => {
                const labels = {
                  V_B: "Vertical Depth at KOP (V_B)",
                  V_t: "True Vertical Depth (V_t)",
                  H_t: "Horizontal Displacement (H_t)",
                  BUR: "Build Up Rate (BUR)",
                };
                const units = {
                  V_B: "ft",
                  V_t: "ft",
                  H_t: "ft",
                  BUR: "°/100ft",
                };
                const placeholders = {
                  V_B: "e.g., 1000",
                  V_t: "e.g., 5000",
                  H_t: "e.g., 3000",
                  BUR: "e.g., 2",
                };
                return (
                  <div key={field} className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {labels[field]}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name={field}
                        value={inputs[field]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder={placeholders[field]}
                      />
                      <span className="absolute right-4 top-3.5 text-gray-500 text-sm font-medium">
                        {units[field]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
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
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8">
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
                  { label: "Build Angle (α)", value: results.alpha, unit: "degrees" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-white/80 rounded-lg p-4 shadow-sm"
                  >
                    <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {item.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.unit}</div>
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

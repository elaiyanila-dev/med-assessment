import React, { useState } from "react";
import { Search, Plus, X, Loader2, Check } from "lucide-react";
import { api } from "../../services/api";

interface InventoryMasterTabProps {
  medicines: any[];
  onSuccess?: () => void;
}

export const InventoryMasterTab: React.FC<InventoryMasterTabProps> = ({
  medicines = [],
  onSuccess
}) => {
  const safeMeds = Array.isArray(medicines) ? medicines : [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedForEdit, setSelectedMedForEdit] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter medicines by search query (Medicine Name, Generic Name, Category, Rack)
  const filteredMeds = safeMeds.filter((med) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (med.name || "").toLowerCase();
    const generic = (med.genericName || "").toLowerCase();
    const cat = (med.category || "").toLowerCase();
    const rack = (med.rackLocation || med.rack || "").toLowerCase();

    return (
      name.includes(q) ||
      generic.includes(q) ||
      cat.includes(q) ||
      rack.includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* SEARCH AND ADD NEW DRUG ACTION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Medicine, Generic Name, Category, Rack..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 bg-slate-50/50"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Drug</span>
        </button>
      </div>

      {/* INVENTORY MASTER TABLE MATCHING SCREENSHOT 1 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-5">MEDICINE NAME</th>
                <th className="py-3.5 px-5">RACK LOC</th>
                <th className="py-3.5 px-5">STOCK LEVEL</th>
                <th className="py-3.5 px-5">UNIT PRICE</th>
                <th className="py-3.5 px-5">EXPIRY</th>
                <th className="py-3.5 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMeds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No medicine records match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredMeds.map((med) => {
                  const stock = med.stock ?? med.stockQuantity ?? 0;
                  const minStock = med.minimumStock || 50;
                  const isLowStock = stock < minStock;

                  const expiryStr = med.expiryDate || "2025-12-01";
                  const expDateObj = new Date(expiryStr);
                  const isExpired = !isNaN(expDateObj.getTime()) && expDateObj.getTime() < Date.now();
                  const isExpiringSoon = !isNaN(expDateObj.getTime()) && expDateObj.getTime() - Date.now() < 30 * 24 * 3600 * 1000;

                  // Serious warning state gets soft red/pink row background matching Screenshot 1
                  const isWarningRow = isExpired || (isLowStock && stock < 20);

                  const rackLoc = med.rackLocation || med.rack || "R1-S1";
                  const categoryName = med.category || "General";

                  return (
                    <tr
                      key={med.id}
                      className={`transition-colors ${
                        isWarningRow
                          ? "bg-rose-50/70 border-l-4 border-l-rose-500 hover:bg-rose-100/50"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* MEDICINE NAME */}
                      <td className="py-3.5 px-5 space-y-1">
                        <div className="font-black text-sm text-[#0f172a] tracking-tight">
                          {med.name}
                        </div>
                        <div className="text-xs font-semibold text-slate-500">
                          {med.genericName || "Pharmaceutical Compound"}
                        </div>

                        {/* BADGES ROW */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded text-[10px] font-extrabold">
                            {categoryName}
                          </span>

                          {isLowStock && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-[10px] rounded uppercase">
                              LOW
                            </span>
                          )}

                          {(isExpired || isExpiringSoon) && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-[10px] rounded uppercase">
                              EXP
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RACK LOC */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-black text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/80 inline-block">
                          {rackLoc}
                        </span>
                      </td>

                      {/* STOCK LEVEL */}
                      <td className="py-3.5 px-5 space-y-0.5">
                        <div className="flex items-center space-x-1.5 font-mono font-bold text-xs text-[#0f172a]">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isLowStock ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                          />
                          <span>{stock} {med.unit || "Tablets"}</span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 pl-3.5">
                          Min: {minStock}
                        </div>
                      </td>

                      {/* UNIT PRICE */}
                      <td className="py-3.5 px-5 font-mono font-black text-xs text-[#0f172a]">
                        ₹{med.unitPrice || 10}
                      </td>

                      {/* EXPIRY */}
                      <td className="py-3.5 px-5 font-mono font-bold text-xs">
                        <span className={isExpired ? "text-rose-600 font-black" : "text-slate-700"}>
                          {expiryStr}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-3.5 px-5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedMedForEdit(med)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200/80 shadow-2xs cursor-pointer transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MEDICINE MODAL */}
      {selectedMedForEdit && (
        <EditMedicineModal
          medicine={selectedMedForEdit}
          onClose={() => setSelectedMedForEdit(null)}
          onSuccess={() => {
            setSelectedMedForEdit(null);
            if (onSuccess) onSuccess();
          }}
        />
      )}

      {/* ADD NEW DRUG MODAL */}
      {isAddModalOpen && (
        <AddMedicineModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </div>
  );
};

// --- EDIT MEDICINE MODAL ---
const EditMedicineModal: React.FC<{ medicine: any; onClose: () => void; onSuccess: () => void }> = ({
  medicine,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState(medicine.name || "");
  const [genericName, setGenericName] = useState(medicine.genericName || "");
  const [category, setCategory] = useState(medicine.category || "General");
  const [rackLocation, setRackLocation] = useState(medicine.rackLocation || medicine.rack || "R1-S1");
  const [stockQuantity, setStockQuantity] = useState(String(medicine.stock ?? medicine.stockQuantity ?? 100));
  const [minimumStock, setMinimumStock] = useState(String(medicine.minimumStock || 50));
  const [unitPrice, setUnitPrice] = useState(String(medicine.unitPrice || 10));
  const [expiryDate, setExpiryDate] = useState(medicine.expiryDate || "2025-12-01");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.put(`/pharmacy/inventory/${medicine.id}`, {
        name,
        genericName,
        category,
        rackLocation,
        stockQuantity: Number(stockQuantity),
        minimumStock: Number(minimumStock),
        unitPrice: Number(unitPrice),
        expiryDate
      });

      if (response.data?.success) {
        onSuccess();
      } else {
        throw new Error(response.data?.error?.message || "Failed to update inventory record");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to update inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto select-none">
        <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">Update Medicine Record</h2>
            <div className="text-xs font-bold text-slate-300 mt-0.5">{medicine.name}</div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Medicine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Generic Composition</label>
            <input
              type="text"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Rack Location</label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Stock Qty</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Min Stock</label>
              <input
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Unit Price (₹)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- ADD NEW DRUG MODAL ---
const AddMedicineModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [category, setCategory] = useState("Analgesic");
  const [rackLocation, setRackLocation] = useState("R1-S1");
  const [stockQuantity, setStockQuantity] = useState("500");
  const [minimumStock, setMinimumStock] = useState("100");
  const [unitPrice, setUnitPrice] = useState("15");
  const [expiryDate, setExpiryDate] = useState("2026-12-31");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await api.post("/pharmacy/inventory", {
        name,
        genericName,
        category,
        rackLocation,
        stockQuantity: Number(stockQuantity),
        minimumStock: Number(minimumStock),
        unitPrice: Number(unitPrice),
        expiryDate
      });

      if (response.data?.success) {
        onSuccess();
      } else {
        throw new Error(response.data?.error?.message || "Failed to add new drug");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || err.message || "Failed to add drug");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-auto select-none">
        <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-black tracking-tight text-white">Add New Drug</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Medicine Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Generic Composition</label>
            <input
              type="text"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              placeholder="e.g. Paracetamol"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Rack Location</label>
              <input
                type="text"
                value={rackLocation}
                onChange={(e) => setRackLocation(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Stock Qty</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Min Stock</label>
              <input
                type="number"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Unit Price (₹)</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono font-bold"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer flex items-center space-x-1 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Add Drug</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

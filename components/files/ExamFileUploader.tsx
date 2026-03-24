"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { addExamFile } from "@/app/actions/files";
import { UploadCloud, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExamFileUploader({ examinationId }: { examinationId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    try {
      setIsUploading(true);
      setError("");

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      await addExamFile(examinationId, {
        url: blob.url,
        name: file.name,
        type: file.type,
        size: file.size,
      });

      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 
        "Dosya yüklenemedi. Lütfen .env dosyanıza veya Vercel ayarlarına BLOB_READ_WRITE_TOKEN değişkenini eklediğinizden emin olun."
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 mt-4">
      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
        <UploadCloud className="w-4 h-4 text-blue-400" />
        Dosya Ekle
      </h3>
      
      {error && (
        <div className="mb-3 text-[11px] leading-tight bg-red-500/10 text-red-400 p-2.5 rounded-lg border border-red-500/20">
          {error}
        </div>
      )}

      <label className={`
        flex flex-col items-center justify-center w-full h-32 
        border-2 border-dashed rounded-xl cursor-pointer 
        transition-all text-slate-400 
        ${isUploading ? "border-slate-700 bg-slate-800/50" : "border-slate-700 hover:border-blue-500 hover:bg-slate-800/50"}
      `}>
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <Loader2 className="w-8 h-8 mb-2 animate-spin text-blue-400" />
          ) : (
            <UploadCloud className="w-8 h-8 mb-2 opacity-50 text-slate-500" />
          )}
          <p className="text-sm font-medium">
            {isUploading ? "Yükleniyor..." : "Dosya seç veya sürükle"}
          </p>
          {!isUploading && (
            <p className="text-[11px] text-slate-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*,application/pdf"
          disabled={isUploading}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}

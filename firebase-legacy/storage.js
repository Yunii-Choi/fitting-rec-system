// firebase/storage.js
//
// OOTD 사진 업로드/조회/삭제 헬퍼.
// Storage 경로 규칙:  ootd/{userId}/{photoType}/{timestamp}_{filename}
//   photoType: "DAILY" | "DATE" | "ME"

import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { storage } from "./firebase-config.js";

/**
 * OOTD 사진 업로드
 * @param {string} userId
 * @param {"DAILY"|"DATE"|"ME"} photoType
 * @param {File} file
 * @returns {Promise<{path: string, url: string}>}
 */
export async function uploadOOTD(userId, photoType, file) {
  const path = `ootd/${userId}/${photoType}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { path, url };
}

/** 특정 유저의 OOTD 사진 목록 조회 */
export async function listOOTD(userId, photoType) {
  const dirRef = ref(storage, `ootd/${userId}/${photoType}`);
  const res = await listAll(dirRef);
  return Promise.all(
    res.items.map(async (item) => ({
      path: item.fullPath,
      url: await getDownloadURL(item),
    }))
  );
}

/** 사진 삭제 (경로 기준) */
export async function deleteOOTD(path) {
  await deleteObject(ref(storage, path));
}

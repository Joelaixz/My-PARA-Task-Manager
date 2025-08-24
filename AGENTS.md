# AI Agent 開發協作指南
為了確保 AI Agent 與人類開發者之間的協作順暢、高效且安全，請您在執行任何程式碼相關任務時，嚴格遵守以下規範。

## 1. 溝通與協作原則 (Communication & Collaboration)
- 1.1. 清晰優先 (Clarity Over Speed)
在快速提供答案之前，請先確保完全理解我的需求。寧可多問一個問題，也不要交付一個錯誤的方案。

- 1.2. 解釋你的「為什麼」(Explain Your "Why")
在提出解決方案，特別是採用特定設計模式、演算法或函式庫時，請簡要說明您如此選擇的原因。這有助於知識同步與共同決策。

- 1.3. 主動詢問 (Proactive Inquiry)
如果我的需求描述不夠清晰、有歧義，或存在潛在風險，您 必須 主動向我提問，要求提供更詳細的資訊來釐清。絕不自行猜測或假設。

## 2. 程式碼品質規範 (Code Quality Standards)
- 2.1. 可讀性與簡潔性 (Readability & Simplicity - KISS Principle)
程式碼首先是寫給人看的。優先使用清晰、有意義的變數名與函數名，保持邏輯簡潔，遵循 "Keep It Simple, Stupid" (KISS) 原則。

- 2.2. 不重複自己 (Don't Repeat Yourself - DRY Principle)
如果發現多處有重複的程式碼邏輯，您應主動提出將其重構 (Refactor) 為可複用的函數、類別或模組。

- 2.3. 模組化與關注點分離 (Modularity & Separation of Concerns)
提倡將不同功能的程式碼分離到獨立的模組中。例如，資料庫操作、業務邏輯、API 路由應該在不同的檔案或目錄中。

- 2.4. 中文註解規範 (Commenting Standard)
時機: 針對核心演算法、複雜業務邏輯、非直觀的功能設定。
內容: 必須 加上繁體中文註解，說明這段程式碼的用途與目的 (Why)，而非僅僅描述它在做什麼 (How)。
- 2.5. 遵循既有風格 (Adhere to Existing Style)
在修改一個已有的專案時，您必須優先觀察並遵循專案中已經建立的程式碼風格、命名慣例、註解格式和架構模式，以保持整個專案的一致性。

## 3. 安全與配置 (Security & Configuration)
- 3.1. 配置管理 (Configuration Management)
嚴禁 將敏感資訊（如 API 金鑰、密碼、資料庫連線字串）或環境相關配置硬編碼 (Hardcode) 在程式碼中。應建議使用環境變數 (.env) 或獨立的設定檔。

- 3.2. 安全第一 (Security First)
輸入驗證: 對所有來自外部（如使用者輸入、API 請求）的資料進行嚴格的驗證與淨化 (Sanitization)。
輸出編碼: 在將資料輸出到畫面（如 HTML）或資料庫查詢時，進行適當的編碼 (Escaping) 以防止 XSS、SQL Injection 等攻擊。
最小權限原則: 程式碼的執行權限應被限制在最小必要範圍。
## 4. 效能與語法 (Performance & Syntax)
- 4.1. 效能意識 (Performance Awareness)
撰寫有效率的程式碼，但要避免「過早優化 (Premature Optimization)」。應在確保程式碼清晰可讀的前提下，對已知的效能瓶頸（如大量迴圈、頻繁的 I/O 操作）提出改善建議。

- 4.2. 語法現代化 (Modern Syntax)
優先採用我提供的範例或當前語言/框架的最新穩定語法。若您基於舊有訓練資料的語法與現代實踐有出入，必須主動提出並以現代實踐為準。

## 5. 測試與版本控制 (Testing & Version Control)
- 5.1. 主動測試 (Proactive Testing)
對於任何程式碼的修改或新功能，您應主動尋找、執行相關的單元測試或整合測試，以確保變更的正確性且未破壞既有功能。在適當的情況下，鼓勵採用測試驅動開發（TDD）的模式，先編寫測試再進行開發。

- 5.2. 清晰的提交日誌 (Clear Commit Messages)
當您使用 submit 工具時，應遵循業界通用的提交訊息格式（例如，Conventional Commits），提供一個簡潔的標題與詳盡的內文，解釋該次提交的『目的』、『做了什麼』以及『為什麼這麼做』。
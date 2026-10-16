(() => {

    // =========================
    // Bootstrap
    // =========================

    if (!document.getElementById("bootstrap-scanner")) {

        const link = document.createElement("link");
        link.id = "bootstrap-scanner";
        link.rel = "stylesheet";
        link.href =
            "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";

        document.head.appendChild(link);
    }

    // =========================
    // Guardar página original
    // =========================

    window.__originalBody = document.body.innerHTML;

    document.body.innerHTML = "";

    // =========================
    // UI
    // =========================

    const container = document.createElement("div");

    container.innerHTML = `
    <div id="scanner-app"
         class="position-fixed top-0 start-0 w-100 h-100 bg-white"
         style="z-index:999999;overflow:auto">

        <div class="container-fluid p-4">

            <h2 class="mb-4">
                URL Scanner
            </h2>

            <div class="card mb-3">
                <div class="card-body">

                    <div class="row g-2">

                        <div class="col-auto">
                            <input
                                type="file"
                                id="txtFile"
                                accept=".txt"
                                class="form-control">
                        </div>

                        <div class="col-auto">
                            <button
                                id="loadBtn"
                                class="btn btn-primary">
                                Cargar TXT
                            </button>
                        </div>

                        <div class="col-auto">
                            <button
                                id="scanBtn"
                                class="btn btn-success">
                                Escanear
                            </button>
                        </div>

                        <div class="col-auto">
                            <button
                                id="restoreBtn"
                                class="btn btn-secondary">
                                Restaurar Página
                            </button>
                        </div>

                    </div>

                </div>
            </div>

            <div class="card mb-3">
                <div class="card-body">

                    <div class="row align-items-center g-2">

                        <div class="col-auto">
                            <label class="form-label mb-0">
                                Filtro HTTP
                            </label>
                        </div>

                        <div class="col-auto">
                            <select
                                id="httpFilter"
                                class="form-select">

                                <option value="">Todos</option>
                                <option value="2">2xx</option>
                                <option value="3">3xx</option>
                                <option value="401">401</option>
                                <option value="403">403</option>
                                <option value="4">4xx</option>
                                <option value="5">5xx</option>
                                <option value="ERROR">Errores</option>

                            </select>
                        </div>

                        <div class="col-auto">
                            <button
                                id="clearFilterBtn"
                                class="btn btn-outline-secondary">
                                Quitar filtro
                            </button>
                        </div>

                        <div class="col">
                            <span class="badge bg-primary fs-6">
                                URLs cargadas:
                                <span id="count">0</span>
                            </span>
                        </div>

                    </div>

                </div>
            </div>

            <div class="mb-3">

                <span class="badge bg-success">2xx</span>
                <span class="badge bg-warning text-dark">3xx</span>
                <span class="badge bg-info text-dark">401/403</span>
                <span class="badge bg-danger">4xx</span>
                <span class="badge bg-dark">5xx</span>
                <span class="badge bg-secondary">ERROR</span>

            </div>

            <div class="progress mb-3">

                <div
                    id="scanProgress"
                    class="progress-bar progress-bar-striped progress-bar-animated"
                    style="width:0%">
                    0%
                </div>

            </div>

            <div class="table-responsive">

                <table class="table table-bordered table-hover table-sm">

                    <thead class="table-dark">

                        <tr>
                            <th>#</th>
                            <th>Path</th>
                            <th>Status</th>
                            <th>Tamaño</th>
                            <th>Content-Type</th>
                            <th>Tiempo</th>
                            <th>Título</th>
                        </tr>

                    </thead>

                    <tbody id="resultTable"></tbody>

                </table>

            </div>

        </div>

    </div>
    `;

    document.body.appendChild(container);

    // =========================
    // Variables
    // =========================

    let loadedLines = [];

    // =========================
    // Utilidades
    // =========================

    function updateProgress(done, total) {

        const p = total === 0
            ? 0
            : Math.round((done / total) * 100);

        const bar =
            document.getElementById("scanProgress");

        bar.style.width = p + "%";
        bar.textContent = p + "%";
    }

    function colorRowByStatus(row, status) {

        row.className = "";

        if (status >= 200 && status < 300) {
            row.classList.add("table-success");
        }
        else if (status >= 300 && status < 400) {
            row.classList.add("table-warning");
        }
        else if (status === 401 || status === 403) {
            row.classList.add("table-info");
        }
        else if (status >= 400 && status < 500) {
            row.classList.add("table-danger");
        }
        else if (status >= 500) {
            row.classList.add("table-dark");
        }
    }

    function applyFilter() {

        const filter =
            document.getElementById("httpFilter").value;

        const rows =
            document.querySelectorAll("#resultTable tr");

        rows.forEach(row => {

            const status =
                row.dataset.status || "";

            let visible = true;

            switch (filter) {

                case "2":
                    visible = /^2/.test(status);
                    break;

                case "3":
                    visible = /^3/.test(status);
                    break;

                case "4":
                    visible = /^4/.test(status);
                    break;

                case "5":
                    visible = /^5/.test(status);
                    break;

                case "401":
                    visible = status === "401";
                    break;

                case "403":
                    visible = status === "403";
                    break;

                case "ERROR":
                    visible = status === "ERROR";
                    break;

                default:
                    visible = true;
            }

            row.style.display =
                visible ? "" : "none";
        });
    }

    // =========================
    // Cargar TXT
    // =========================

    document.getElementById("loadBtn")
        .addEventListener("click", () => {

            const fileInput =
                document.getElementById("txtFile");

            if (!fileInput.files.length) {

                alert("Seleccione un TXT");

                return;
            }

            const reader = new FileReader();

            reader.onload = e => {

                loadedLines = e.target.result
                    .split(/\r?\n/)
                    .map(x => x.trim())
                    .filter(x => x.length);

                document.getElementById("count")
                    .textContent = loadedLines.length;

                alert(
                    loadedLines.length +
                    " rutas cargadas"
                );
            };

            reader.readAsText(
                fileInput.files[0]
            );
        });

    // =========================
    // Escaneo Individual
    // =========================

    async function scanOne(path, index) {

        const tbody =
            document.getElementById("resultTable");

        const row = tbody.insertRow();

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${path}</td>
            <td>Procesando...</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
        `;

        try {

            const currentUrl =
                new URL(window.location.href);

            let fullUrl;

            if (
                path.startsWith("http://") ||
                path.startsWith("https://")
            ) {
                fullUrl = path;
            }
            else {
                fullUrl =
                    currentUrl.origin +
                    (path.startsWith("/")
                        ? path
                        : "/" + path);
            }

            const start =
                performance.now();

            const resp = await fetch(
                fullUrl,
                {
                    method: "GET",
                    credentials: "include",
                    redirect: "follow"
                }
            );

            const body =
                await resp.text();

            const elapsed =
                Math.round(
                    performance.now() - start
                );

            const contentType =
                resp.headers.get(
                    "content-type"
                ) || "";

            let title = "";

            if (
                contentType
                    .toLowerCase()
                    .includes("text/html")
            ) {

                try {

                    const parser =
                        new DOMParser();

                    const doc =
                        parser.parseFromString(
                            body,
                            "text/html"
                        );

                    title =
                        doc.title || "";

                } catch {
                }
            }

            row.cells[2].textContent =
                resp.status;

            row.cells[3].textContent =
                body.length.toLocaleString();

            row.cells[4].textContent =
                contentType;

            row.cells[5].textContent =
                elapsed + " ms";

            row.cells[6].textContent =
                title;

            row.dataset.status =
                resp.status;

            colorRowByStatus(
                row,
                resp.status
            );

            applyFilter();

        } catch (ex) {

            row.cells[2].textContent =
                "ERROR";

            row.cells[6].textContent =
                ex.message;

            row.dataset.status =
                "ERROR";

            row.classList.add(
                "table-secondary"
            );

            applyFilter();
        }
    }

    // =========================
    // Escanear
    // =========================

    document.getElementById("scanBtn")
        .addEventListener(
            "click",
            async () => {

                if (
                    loadedLines.length === 0
                ) {

                    alert(
                        "Primero cargue un TXT"
                    );

                    return;
                }

                document
                    .getElementById(
                        "resultTable"
                    )
                    .innerHTML = "";

                updateProgress(
                    0,
                    loadedLines.length
                );

                const concurrency = 10;

                let completed = 0;

                for (
                    let i = 0;
                    i < loadedLines.length;
                    i += concurrency
                ) {

                    const batch =
                        loadedLines.slice(
                            i,
                            i + concurrency
                        );

                    await Promise.all(

                        batch.map(
                            async (
                                item,
                                index
                            ) => {

                                await scanOne(
                                    item,
                                    i + index
                                );

                                completed++;

                                updateProgress(
                                    completed,
                                    loadedLines.length
                                );
                            }
                        )

                    );
                }

                alert(
                    "Escaneo finalizado"
                );
            }
        );

    // =========================
    // Filtros
    // =========================

    document
        .getElementById("httpFilter")
        .addEventListener(
            "change",
            applyFilter
        );

    document
        .getElementById("clearFilterBtn")
        .addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "httpFilter"
                    )
                    .value = "";

                applyFilter();
            }
        );

    // =========================
    // Restaurar
    // =========================

    document
        .getElementById(
            "restoreBtn"
        )
        .addEventListener(
            "click",
            () => {

                if (
                    window.__originalBody
                ) {

                    document.body.innerHTML =
                        window.__originalBody;
                }
            }
        );

})();
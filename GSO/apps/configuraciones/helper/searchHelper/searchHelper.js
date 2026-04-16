export class SearchHelper {
  /**
   * Crea un contenedor de búsqueda con input y botones
   * @param {string} containerId - ID del elemento donde insertar el buscador
   * @param {Function} onSearch - Callback cuando se ejecuta la búsqueda
   * @param {Function} onClear - Callback cuando se limpia la búsqueda
   */
  static createSearchContainer(containerId, onSearch, onClear) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Contenedor ${containerId} no encontrado`);
      return null;
    }

    const searchHTML = `
      <div class="search-container mb-3">
        <div class="input-group">
          <input 
            type="text" 
            class="form-control search-input" 
            placeholder="Buscar..." 
            id="searchInput_${containerId}"
          >
          <button 
            class="btn btn-outline-primary search-btn" 
            type="button" 
            id="searchBtn_${containerId}"
            title="Buscar"
          >
            <i class="e-icons e-search"></i> Buscar
          </button>
          <button 
            class="btn btn-outline-secondary clear-btn" 
            type="button" 
            id="clearBtn_${containerId}"
            title="Limpiar búsqueda"
          >
            <i class="e-icons e-close"></i> Limpiar
          </button>
        </div>
        <small class="text-muted d-block mt-2" id="searchInfo_${containerId}">
          Ingresa texto para filtrar resultados
        </small>
      </div>
    `;

    // Insertar HTML antes del grid
    container.insertAdjacentHTML('beforebegin', searchHTML);

    // Event listeners
    const searchInput = document.getElementById(`searchInput_${containerId}`);
    const searchBtn = document.getElementById(`searchBtn_${containerId}`);
    const clearBtn = document.getElementById(`clearBtn_${containerId}`);
    const searchInfo = document.getElementById(`searchInfo_${containerId}`);

    searchBtn.addEventListener('click', () => {
      const searchTerm = searchInput.value.trim();
      onSearch(searchTerm);
      if (searchTerm) {
        searchInfo.textContent = `Buscando: "${searchTerm}"`;
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      onClear();
      searchInfo.textContent = 'Ingresa texto para filtrar resultados';
    });

    return {
      getSearchTerm: () => searchInput.value.trim(),
      setSearchTerm: (term) => { searchInput.value = term; },
      getSearchInput: () => searchInput,
      getSearchInfo: () => searchInfo,
    };
  }
}
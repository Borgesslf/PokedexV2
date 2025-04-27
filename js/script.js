const typeColors = {
    normal: '#A8A77A', // Cor para o tipo normal
    fire: '#EE8130', // Cor para o tipo fogo
    water: '#6390F0', // Cor para o tipo água
    electric: '#F7D02C', // Cor para o tipo elétrico
    grass: '#7AC74C', // Cor para o tipo grama
    ice: '#96D9D6', // Cor para o tipo gelo
    fighting: '#C22E28', // Cor para o tipo luta
    poison: '#A33EA1', // Cor para o tipo veneno
    ground: '#E2BF65', // Cor para o tipo terra
    flying: '#A98FF3', // Cor para o tipo voador
    psychic: '#F95587', // Cor para o tipo psíquico
    bug: '#A6B91A', // Cor para o tipo inseto
    rock: '#B6A136', // Cor para o tipo rocha
    ghost: '#735797', // Cor para o tipo fantasma
    dragon: '#6F35FC', // Cor para o tipo dragão
    dark: '#705746', // Cor para o tipo trevas
    steel: '#B7B7CE', // Cor para o tipo aço
    fairy: '#D685AD' // Cor para o tipo fada
};

// Seletores para elementos da página
const pokemonType = document.querySelector('.pokemon__type');
const pokemonName = document.querySelector('.pokemon__name');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonImage = document.querySelector('.pokemon__image');
const counters = document.querySelector('.counters');
const form = document.querySelector('.form');
const input = document.querySelector('.input__search');
const buttonPrev = document.querySelector('.btn-prev');
const buttonNext = document.querySelector('.btn-next');

let searchPokemon = 1; // Pokémon inicial

// Função para buscar dados de um Pokémon na API
const fetchPokemon = async (pokemon) => {
    const APIResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
    if (APIResponse.status == 200) {
        const data = await APIResponse.json();
        return data;
    }
}

// Função para buscar relações de dano dos tipos
const fetchTypeDamageRelations = async (typeName) => {
    const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
    if (response.ok) {
        const data = await response.json();
        return data.damage_relations;
    }
    return null;
}

// Função para renderizar os dados do Pokémon na página
const renderPokemon = async (pokemon) => {
    pokemonName.innerHTML = 'Loading...'; // Mensagem de carregamento
    const data = await fetchPokemon(pokemon);

    if (data) {
        // Mostrar os tipos (invertido)
        const typesHtml = data.types.reverse().map(typeInfo => {
            const typeName = typeInfo.type.name;
            const typeIconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${typeName}.svg`;
            const bgColor = typeColors[typeName] || '#777'; // Cor padrão se não achar
            
            return `
                <span style="
                    display: flex; 
                    align-items: center; 
                    gap: 5px; 
                    margin-right: 5px;
                    background: ${bgColor};
                    padding: 5px 8px;
                    border-radius: 5px;
                    color: white;
                    font-weight: bold;
                ">
                    <img src="${typeIconUrl}" alt="${typeName}" title="${typeName}" style="width: 20px; height: 20px;">
                </span>
            `;
        }).join('');
        pokemonType.innerHTML = typesHtml;

        pokemonName.innerHTML = data.name;
        pokemonNumber.innerHTML = data.id;

        // Imagem do Pokémon
        const animatedSprite = data.sprites.versions['generation-v']['black-white']['animated']['front_default'];
        const staticSprite = data.sprites.front_default;
        if (animatedSprite) {
            pokemonImage.src = animatedSprite;
        } else if (staticSprite) {
            pokemonImage.src = staticSprite;
        } else {
            pokemonImage.style.display = 'none';
        }

        input.value = ''; // Limpando o campo de busca
        searchPokemon = data.id; // Atualizando o número do Pokémon
        pokemonImage.style.display = 'block'; // Exibindo a imagem

        // Calcular e mostrar counters (fraquezas e resistências)
        const types = data.types.map(typeInfo => typeInfo.type.name);
        const multipliers = {};

        for (const type of types) {
            const damageRelations = await fetchTypeDamageRelations(type);

            if (damageRelations) {
                damageRelations.no_damage_from.forEach(t => {
                    multipliers[t.name] = 0; // Imunidade total anula qualquer dano
                });
                
                damageRelations.double_damage_from.forEach(t => {
                    if (multipliers[t.name] !== 0) {
                        multipliers[t.name] = (multipliers[t.name] || 1) * 2;
                    }
                });
                damageRelations.half_damage_from.forEach(t => {
                    if (multipliers[t.name] !== 0) {
                        multipliers[t.name] = (multipliers[t.name] || 1) * 0.5;
                    }
                });                
            }
        }

        const weaknesses = Object.entries(multipliers)
    .filter(([type, multiplier]) => multiplier > 1)
    .sort((a, b) => b[1] - a[1]); // Ordenando da maior fraqueza para a menor

        // Atualizando a div dos counters
        if (weaknesses.length > 0) {
            const weaknessesHtml = weaknesses.map(([typeName, multiplier]) => {
                const typeIconUrl = `https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/${typeName}.svg`;
                const bgColor = typeColors[typeName] || '#777'; // Cor padrão se não achar
            
                return `
                    <div style="
                        display: flex; 
                        flex-direction: column;
                        align-items: center; 
                        justify-content: center;
                        gap: 2px;
                        margin-right: 1px;
                        background: ${bgColor};
                        padding: 5px 8px;
                        border-radius: 8px;
                        color: white;
                        font-weight: bold;
                        min-width: 0px;
                    ">
                        <img src="${typeIconUrl}" alt="${typeName}" title="${typeName}" style="width: 24px; height: 24px;">
                        <span style="font-size: 0.75rem;">${multiplier}x</span>
                    </div>
                `;
            }).join('');
            counters.innerHTML = weaknessesHtml;
        } else {
            counters.innerHTML = 'Sem fraquezas conhecidas.';
        }

    } else {
        pokemonImage.style.display = 'none';
        pokemonName.innerHTML = 'Pokemon ñ encontrado'; // Mensagem de erro
        pokemonNumber.innerHTML = '';
    }
}

// Evento de submit para a pesquisa
form.addEventListener('submit', (event) => {
    event.preventDefault();
    renderPokemon(input.value.toLowerCase()); // Chamando a função renderPokemon com o valor da busca
});

// Navegação entre os Pokémon (botões de próximo e anterior)
buttonPrev.addEventListener('click', () => {
    if (searchPokemon > 1) {
        searchPokemon -= 1;
        renderPokemon(searchPokemon);
    }
});

buttonNext.addEventListener('click', () => {
    searchPokemon += 1;
    renderPokemon(searchPokemon);
});

renderPokemon(searchPokemon); // Chamando a função renderPokemon ao inicializar a página

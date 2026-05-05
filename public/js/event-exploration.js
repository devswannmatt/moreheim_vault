(function () {
    function toInt(value, fallback) {
        var parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? fallback : parsed;
    }

    var EXPLORATION_SPECIALS = {
        2: {
            1: {
                title: 'Well',
                description: 'Choose one Hero and roll a D6. If the roll is equal to or lower than Toughness, gain 1 shard. Otherwise the Hero is sick and misses the next game.',
                roll: { type: 'test', stat: 't', pass: 'Gain 1 shard', fail: 'Hero is sick and misses the next game' }
            },
            2: {
                title: 'Shop',
                description: 'Find loot worth D6 gc. On a roll of 1, also find a Lucky Charm.',
                roll: { type: 'd6gc', bonus: { 1: 'Also find a Lucky Charm' } }
            },
            3: {
                title: 'Corpse',
                description: 'Roll a D6: 1-2 D6 gc, 3 Dagger, 4 Axe, 5 Sword, 6 Suit of light armour.',
                roll: {
                    type: 'd6',
                    1: { reward: 'd6gc'},
                    2: { reward: 'd6gc'},
                    3: { reward: 'dagger' },
                    4: { reward: 'axe' },
                    5: { reward: 'sword' },
                    6: { reward: 'suit_of_light_armour' }
                }
            },
            4: {
                title: 'Straggler',
                description: 'Skaven: sell for 2D6 gc. Possessed: leader gains +1 Experience. Undead: gain a free Zombie. Others: next exploration roll one extra die and discard one.',
                roll: {
                    type: 'warband',
                    skaven: { reward: '2d6gc' },
                    possessed: { reward: 'leader_1xp' },
                    undead: { reward: '1zombie' },
                    default: { reward: 'bonus_exploration' }
                }
            },
            5: {
                title: 'Overturned Cart',
                description: 'Roll a D6: 1-2 Mordheim Map, 3-4 purse with 2D6 gc, 5-6 jewelled sword and dagger (sell at twice normal value rules applied).',
                roll: {
                    type: 'd6',
                    1: { reward: 'mordheim_map' },
                    2: { reward: 'mordheim_map' },
                    3: { reward: '2d6gc' },
                    4: { reward: '2d6gc' },
                    5: { reward: 'jewelled_sword, jewelled_dagger' },
                    6: { reward: 'jewelled_sword, jewelled_dagger' }
                }
            },
            6: {
                title: 'Ruined Hovels',
                description: 'Find loot worth D6 gc.',
                roll: { type: 'd6gc' }
            }
        },
        3: {
            1: {
                title: 'Tavern',
                description: 'Leader takes Leadership test: pass gains 4D6 gc worth of alcohol, fail leaves only D6 gc worth. Undead, Witch Hunter, and Sisters of Sigmar automatically pass.',
                roll: { type: 'test', stat: 'ld', pass: 'Gain 4D6 gc worth of alcohol', fail: 'Gain D6 gc worth of alcohol' }
            },
            2: {
                title: 'Smithy',
                description: 'Roll a D6: 1 Sword, 2 Double-handed weapon, 3 Flail, 4 D3 Halberds, 5 Lance, 6 2D6 gc worth of metal.',
                roll: {
                    type: 'd6',
                    1: { reward: 'sword' },
                    2: { reward: 'double_handed_weapon' },
                    3: { reward: 'flail' },
                    4: { reward: 'd3_halberds' },
                    5: { reward: 'lance' },
                    6: { reward: '2d6gc' }
                }
            },
            3: {
                title: 'Prisoners',
                description: 'Possessed: sacrifice for D3 Experience among Heroes. Undead: gain D3 Zombies. Skaven: sell for 3D6 gc. Others: gain 2D6 gc and may add one human Henchman to a group.',
                roll: {
                    type: 'warband',
                    possessed: { reward: 'sacrifice_for_experience' },
                    undead: { reward: 'd3_zombies' },
                    skaven: { reward: '3d6gc' },
                    default: { reward: '2d6gc, henchman' }
                }
            },
            4: {
                title: 'Fletcher',
                description: 'Roll a D6: 1-2 D3 Short Bows, 3 D3 Bows, 4 D3 Long Bows, 5 Quiver of Hunting Arrows, 6 D3 Crossbows.',
                roll: {
                    type: 'd6',
                    1: { reward: 'd3_short_bows' },
                    2: { reward: 'd3_short_bows' },
                    3: { reward: 'd3_bows' },
                    4: { reward: 'd3_long_bows' },
                    5: { reward: 'quiver_of_hunting_arrows' },
                    6: { reward: 'd3_crossbows' }
                }   
            },
            5: {
                title: 'Market Hall',
                description: 'Find several items worth 2D6 gc in total.',
                roll: { type: '2d6gc' }
            },
            6: {
                title: 'Returning a Favour',
                description: 'Gain one available Hired Sword for the next game for free; keep paying upkeep afterward to retain them.',
                roll: { type: 'hired_sword' } // Placeholder, will need to add list of hired_swords but they haven't been added yet.
            }
        },
        4: {
            1: {
                title: 'Gunsmith',
                description: 'Roll a D6: 1 Blunderbuss, 2 Brace of Pistols, 3 Brace of Duelling Pistols, 4 D3 Handguns, 5 D3 Flasks of Superior Blackpowder, 6 Hochland Long Rifle.',
                roll: {
                    type: 'd6',
                    1: { reward: 'blunderbuss' },
                    2: { reward: 'brace_of_pistols' },
                    3: { reward: 'brace_of_duelling_pistols' },
                    4: { reward: 'd3_handguns' },
                    5: { reward: 'd3_flasks_of_superior_blackpowder' },
                    6: { reward: 'hochland_long_rifle' }
                }
            },
            2: {
                title: 'Shrine',
                description: 'Gain 3D6 gc loot. Sisters of Sigmar or Witch Hunter may instead receive 3D6 gc from patrons and bless one weapon to wound Undead/Possessed on 2+.',
                roll: {
                    type: 'warband',
                    sisters_of_sigmar: { reward: '3d6gc, blessed_weapon' },
                    witch_hunter: { reward: '3d6gc, blessed_weapon' },
                    default: { reward: '3d6gc' }
                }
            },
            3: {
                title: 'Townhouse',
                description: 'Find 3D6 gc worth of loot.',
                roll: { type: '3d6gc' }
            },
            4: {
                title: 'Armourer',
                description: 'Roll a D6: 1-2 D3 Shields or Bucklers, 3 D3 Helmets, 4 D3 Light Armour, 5 D3 Heavy Armour, 6 Suit of Ithilmar Armour.',
                roll: {
                    type: 'd6',
                    1: { reward: 'd3_shields' },
                    2: { reward: 'd3_shields' },
                    3: { reward: 'd3_helmets' },
                    4: { reward: 'd3_light_armour' },
                    5: { reward: 'd3_heavy_armour' },
                    6: { reward: 'suit_of_ithilmar_armour' }
                }
            },
            5: {
                title: 'Graveyard',
                description: 'Most warbands may loot for D6x10 gc and are hated next game vs Sisters/Witch Hunters. Sisters of Sigmar and Witch Hunters may seal graves for D6 Experience among Heroes.',
                roll: {
                    type: 'warband',
                    sisters_of_sigmar: { reward: 'd6_experience' },
                    witch_hunter: { reward: 'd6_experience' },
                    default: { reward: 'd6x10gc' }
                }
            },
            6: {
                title: 'Catacombs',
                description: 'In next game, set up up to 3 eligible fighters at ground level at end of your first turn, not within 8" of enemies.'
            }
        },
        5: {
            1: {
                title: 'Moneylender\'s House',
                description: 'Find D6x10 gc.',
                roll: { type: 'd6x10gc' }
            },
            2: {
                title: 'Alchemist\'s Laboratory',
                description: 'Find loot worth 3D6 gc and a notebook. One Hero may gain access to Academic skills in addition to normal options.',
                roll: { type: '3d6gc, tome_academic' }
            },
            3: {
                title: 'Jewelsmith',
                description: 'Roll a D6: 1-2 Quartz worth D6x5 gc, 3-4 Amethyst 20 gc, 5 Necklace 50 gc, 6 Ruby worth D6x15 gc. Keeping gems grants +1 to rare item rolls for one Hero.',
                roll: {
                    type: 'roll',
                    1: { reward: 'd6x5gc' },
                    2: { reward: 'd6x5gc' },
                    3: { reward: '20gc' },
                    4: { reward: '20gc' },
                    5: { reward: '50gc' },
                    6: { reward: 'd6x15gc' }
                }
            },
            4: {
                title: 'Merchant\'s House',
                description: 'Find valuables worth 2D6x5 gc. On a double for this roll, instead find the Order of Freetraders symbol; a Hero gains Haggle.',
                roll: { type: '2d6x5gc', bonus: { double: 'Order of Freetraders symbol, gain Haggle' } }
            },
            5: {
                title: 'Shattered Building',
                description: 'Find D3 shards. Also pass a Leadership test to gain a wardog.'
            },
            6: {
                title: 'Entrance to the Catacombs',
                description: 'Gain a permanent re-roll of one exploration die. Additional copies do not stack.'
            }
        },
        6: {
            1: {
                title: 'The Pit',
                description: 'Send one Hero: on 1 the Hero is lost; on 2+ the Hero returns with D6+1 shards.'
            },
            2: {
                title: 'Hidden Treasure',
                description: 'Find 5D6x5 gc automatically and roll separately for listed treasure: wyrdstone, Holy Relic, Heavy Armour, gems, Elven Cloak, Holy Tome, Magical Artefact.'
            },
            3: {
                title: 'Dwarf Smithy',
                description: 'Roll a D6: 1 D3 Double-handed axes, 2 D3 Heavy Armour, 3 Gromril Axe, 4 Gromril Hammer, 5 Double-handed Gromril Axe, 6 Gromril Armour.'
            },
            4: {
                title: 'Slaughtered Warband',
                description: 'Gain 3D6x5 gc and roll separately for listed gear including armour, daggers, map, halberds, swords, shields, bows, helmets.'
            },
            5: {
                title: 'Fighting Arena',
                description: 'Find a training manual worth 100 gc or have a Hero read it to gain Combat skill access and +1 WS maximum.'
            },
            6: {
                title: 'Noble\'s Villa',
                description: 'Roll a D6: 1-2 D6x10 gc, 3-4 D6 vials of Crimson Shade, 5-6 hidden magical artefact (roll on Magical Artefacts table).'
            }
        }
    };

    function matchLabel(count, face) {
        if (count === 2) return 'Pair of ' + face;
        if (count === 3) return 'Triple ' + face;
        if (count === 4) return 'Four of a kind (' + face + ')';
        if (count === 5) return 'Five of a kind (' + face + ')';
        return 'Six of a kind (' + face + ')';
    }

    function analyzeMatches(rolls) {
        var counts = {};
        rolls.forEach(function (value) {
            counts[value] = (counts[value] || 0) + 1;
        });

        var labels = [];
        var outcomes = [];

        Object.keys(counts)
            .map(function (key) { return toInt(key, 0); })
            .sort(function (a, b) { return a - b; })
            .forEach(function (face) {
                var count = counts[face];
                if (count < 2) return;

                var chartCount = Math.min(count, 6);
                var label = matchLabel(chartCount, face);
                labels.push(label);

                var chart = EXPLORATION_SPECIALS[chartCount] && EXPLORATION_SPECIALS[chartCount][face];
                if (chart) {
                    outcomes.push({
                        label: label,
                        title: chart.title,
                        description: chart.description,
                        roll: chart.roll || null
                    });
                }
            });

        return {
            summary: labels.length ? labels.join(', ') : 'None',
            outcomes: outcomes
        };
    }

    function initExplorationWidget(root) {
        var scope = root || document;
        var form = scope.querySelector('#exploration-form');
        if (!form || form.dataset.explorationBound === '1') return;
        form.dataset.explorationBound = '1';

        var rosterSelect = form.querySelector('#exploration-roster');
        var warbandInput = form.querySelector('#exploration-warband');
        var heroCountInput = form.querySelector('#exploration-hero-count');
        var winBonusInput = form.querySelector('#exploration-win-bonus');
        var rollButton = form.querySelector('#roll-exploration-dice');
        var enterDiceButton = form.querySelector('#enter-exploration-dice');

        var output = form.querySelector('#exploration-roll-output');
        var rollList = form.querySelector('#exploration-roll-list');
        var rollTotal = form.querySelector('#exploration-roll-total');
        var rollMatches = form.querySelector('#exploration-roll-matches');
        var rollOutcomes = form.querySelector('#exploration-roll-outcomes');
        var rollShards = form.querySelector('#exploration-roll-shards');
        var totalRewards = form.querySelector('#exploration-total-rewards');
        var goldInput = form.querySelector('#rewards-gold-base');
        var wyrdstoneInput = form.querySelector('#rewards-wyrdstone-base');
        var submissionGoldInput = form.querySelector('#submission-rewards-gold');
        var submissionWyrdstoneInput = form.querySelector('#submission-rewards-wyrdstone');
        var itemsCsvInput = form.querySelector('#exploration-items');

        var hiddenRolls = form.querySelector('#exploration-rolls-hidden');
        var hiddenTotal = form.querySelector('#exploration-total-hidden');
        var hiddenDice = form.querySelector('#exploration-dice-hidden');
        var rosterMembersData = {};
        var gameResultData = { hasResult: false, draw: false, winnerIds: [], loserIds: [] };

        var rosterDataNode = scope.querySelector('#exploration-roster-members-data') || document.getElementById('exploration-roster-members-data');
        if (rosterDataNode) {
            try {
                rosterMembersData = JSON.parse(rosterDataNode.textContent || '{}');
            } catch (e) {
                rosterMembersData = {};
            }
        }

        var resultDataNode = scope.querySelector('#game-result-data') || document.getElementById('game-result-data');
        if (resultDataNode) {
            try {
                gameResultData = JSON.parse(resultDataNode.textContent || '{}');
            } catch (e) {
                gameResultData = { hasResult: false, draw: false, winnerIds: [], loserIds: [] };
            }
        }

        var STAT_LABELS = {
            m: 'Movement',
            ws: 'Weapon Skill',
            bs: 'Ballistic Skill',
            s: 'Strength',
            t: 'Toughness',
            w: 'Wounds',
            i: 'Initiative',
            a: 'Attacks',
            ld: 'Leadership'
        };

        function setDefaultsFromRoster() {
            if (!rosterSelect || !heroCountInput) return;
            var selected = rosterSelect.options[rosterSelect.selectedIndex];
            if (!selected) return;
            var heroCount = toInt(selected.getAttribute('data-hero-count'), 0);
            var warbandName = selected.getAttribute('data-warband-name') || '-';
            heroCountInput.value = heroCount;
            if (warbandInput) warbandInput.value = warbandName;

            // Auto-set win bonus from result event
            if (winBonusInput) {
                var rosterId = String(rosterSelect.value || '').trim();
                if (gameResultData.draw) {
                    winBonusInput.checked = false;
                    winBonusInput.disabled = true;
                } else if (gameResultData.hasResult) {
                    var isWinner = Array.isArray(gameResultData.winnerIds) && gameResultData.winnerIds.some(function (id) { return String(id) === rosterId; });
                    winBonusInput.checked = isWinner;
                    winBonusInput.disabled = true;
                } else {
                    winBonusInput.disabled = false;
                }
            }

            if (window.M && M.updateTextFields) M.updateTextFields();
        }

        function rollDie(sides) {
            return Math.floor(Math.random() * sides) + 1;
        }

        function rollDice(count, sides) {
            var values = [];
            var total = 0;
            for (var i = 0; i < count; i++) {
                var value = rollDie(sides);
                values.push(value);
                total += value;
            }
            return { values: values, total: total };
        }

        function rewardText(rewardKey) {
            var map = {
                d6gc: 'D6 gc',
                '2d6gc': '2D6 gc',
                '3d6gc': '3D6 gc',
                dagger: 'Dagger',
                axe: 'Axe',
                sword: 'Sword',
                suit_of_light_armour: 'Suit of Light Armour',
                mordheim_map: 'Mordheim Map',
                jewelled_sword_and_dagger: 'Jewelled sword and dagger',
                jewelled_sword: 'Jewelled Sword',
                jewelled_dagger: 'Jewelled Dagger',
                leader_1xp: 'Leader +1 Experience',
                '1zombie': '1 Zombie',
                bonus_exploration: 'Next exploration: roll one extra die and discard one'
            };
            if (map[rewardKey]) return map[rewardKey];

            var raw = String(rewardKey || 'Reward').trim();
            var spaced = raw.replace(/_/g, ' ').replace(/\s+/g, ' ');
            return spaced.replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
        }

        function normalizeItemName(value) {
            return String(value || '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();
        }

        function rollMordheimMapQuality() {
            var mapQualityRoll = rollDie(6);
            if (mapQualityRoll === 1) return { roll: mapQualityRoll, label: 'Mordheim Map (Fake)' };
            if (mapQualityRoll <= 3) return { roll: mapQualityRoll, label: 'Mordheim Map (Vague)' };
            if (mapQualityRoll === 4) return { roll: mapQualityRoll, label: 'Mordheim Map (Catacomb Map)' };
            if (mapQualityRoll === 5) return { roll: mapQualityRoll, label: 'Mordheim Map (Accurate)' };
            return { roll: mapQualityRoll, label: 'Mordheim Map (Master Map)' };
        }

        function titleCaseWords(value) {
            return String(value || '').replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
        }

        function applyTokenReward(token) {
            var clean = String(token || '').trim();
            var out = { impact: emptyRewardImpact(), details: '', display: '' };
            if (!clean) return out;

            var normalized = clean.toLowerCase();

            function singularizeLabel(label) {
                var value = String(label || '').trim();
                if (/\bBows$/i.test(value)) return value.replace(/Bows$/i, 'Bow');
                if (/\bCrossbows$/i.test(value)) return value.replace(/Crossbows$/i, 'Crossbow');
                if (/\bHalberds$/i.test(value)) return value.replace(/Halberds$/i, 'Halberd');
                if (/\bHandguns$/i.test(value)) return value.replace(/Handguns$/i, 'Handgun');
                if (/\bShields$/i.test(value)) return value.replace(/Shields$/i, 'Shield');
                if (/\bHelmets$/i.test(value)) return value.replace(/Helmets$/i, 'Helmet');
                if (/\bFlasks$/i.test(value)) return value.replace(/Flasks$/i, 'Flask');
                if (/\bs$/i.test(value)) return value.replace(/s$/i, '');
                return value;
            }

            var diceItems = normalized.match(/^d(\d+)_([a-z0-9_]+)$/i);
            if (diceItems) {
                var itemDiceSides = Math.max(1, toInt(diceItems[1], 1));
                var qty = rollDie(itemDiceSides);
                var itemToken = diceItems[2];
                var baseLabel = rewardText(itemToken);
                var rolledLabel = qty === 1 ? singularizeLabel(baseLabel) : baseLabel;

                for (var q = 0; q < qty; q++) {
                    out.impact.items.push(rolledLabel);
                }

                out.details = 'Reward roll D' + itemDiceSides + ': ' + qty + ' ' + rolledLabel;
                out.display = 'D' + itemDiceSides + ' ' + baseLabel;
                return out;
            }

            var diceGc = normalized.match(/^(\d*)d6gc$/i);
            if (diceGc) {
                var d6Count = Math.max(1, toInt(diceGc[1] || '1', 1));
                var gcRoll = rollDice(d6Count, 6);
                out.impact.gold += gcRoll.total;
                out.details = 'Reward roll ' + d6Count + 'D6: ' + gcRoll.values.join(' + ') + ' = ' + gcRoll.total + ' gc';
                out.display = rewardText(clean);
                return out;
            }

            var shard = normalized.match(/^(\d+)shards?$/i);
            if (shard) {
                out.impact.shards += Math.max(0, toInt(shard[1], 0));
                out.display = shard[1] + ' shard' + (toInt(shard[1], 0) === 1 ? '' : 's');
                return out;
            }

            if (normalized === 'mordheim_map') {
                out.impact.pendingMapQuality += 1;
                out.details = 'Mordheim Map found. Press Roll Map Quality to resolve it.';
                out.display = 'Mordheim Map';
                return out;
            }

            var label = rewardText(clean);
            out.impact.items.push(label);
            out.display = label;
            return out;
        }

        function splitRewardTokens(value) {
            return String(value || '')
                .split(',')
                .map(function (part) { return String(part || '').trim(); })
                .filter(function (part) { return part.length > 0; });
        }

        function emptyRewardImpact() {
            return { gold: 0, shards: 0, items: [], pendingMapQuality: 0 };
        }

        function rewardImpactFromText(text) {
            var impact = emptyRewardImpact();
            var details = [];
            var source = String(text || '');

            if (!source) {
                return { impact: impact, details: '' };
            }

            var parts = source.split(',').map(function (part) {
                return String(part || '').trim();
            }).filter(function (part) {
                return part.length > 0;
            });

            if (!parts.length) parts = [source];

            parts.forEach(function (part) {
                var gcMatch = part.match(/(\d+)\s*d6\s*gc/i);
                if (gcMatch) {
                    var d6Count = Math.max(1, toInt(gcMatch[1], 1));
                    var gcRoll = rollDice(d6Count, 6);
                    impact.gold += gcRoll.total;
                    details.push('Reward roll ' + d6Count + 'D6: ' + gcRoll.values.join(' + ') + ' = ' + gcRoll.total + ' gc');
                    return;
                }

                if (/\bd6\s*gc/i.test(part)) {
                    var oneGcRoll = rollDie(6);
                    impact.gold += oneGcRoll;
                    details.push('Reward roll D6: ' + oneGcRoll + ' gc');
                }

                // Support natural reward phrases like "D3 Bows" in addition to compact tokens.
                var naturalDiceItem = part.match(/\bd(\d+)\s+([a-z][a-z0-9\s'\-]*)\b/i);
                if (naturalDiceItem && !/\bgc\b/i.test(part)) {
                    var sides = Math.max(1, toInt(naturalDiceItem[1], 1));
                    var itemToken = String(naturalDiceItem[2] || '')
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '_')
                        .replace(/^_+|_+$/g, '');
                    if (itemToken) {
                        var naturalResolved = applyTokenReward('d' + sides + '_' + itemToken);
                        impact.gold += naturalResolved.impact.gold;
                        impact.shards += naturalResolved.impact.shards;
                        impact.pendingMapQuality += naturalResolved.impact.pendingMapQuality || 0;
                        naturalResolved.impact.items.forEach(function (itemName) { impact.items.push(itemName); });
                        if (naturalResolved.details) details.push(naturalResolved.details);
                        return;
                    }
                }

                var shardMatch = part.match(/(\d+)\s*shards?/i);
                if (shardMatch) {
                    impact.shards += Math.max(0, toInt(shardMatch[1], 0));
                }

                if (/lucky\s+charm/i.test(part)) {
                    impact.items.push('Lucky Charm');
                }

                // Also support compact comma-delimited reward tokens like "2d6gc, jewelled_sword"
                var compactTokens = splitRewardTokens(part).filter(function (token) {
                    return /^[a-z0-9_]+$/i.test(token);
                });
                compactTokens.forEach(function (token) {
                    var resolved = applyTokenReward(token);
                    impact.gold += resolved.impact.gold;
                    impact.shards += resolved.impact.shards;
                    impact.pendingMapQuality += resolved.impact.pendingMapQuality || 0;
                    resolved.impact.items.forEach(function (itemName) { impact.items.push(itemName); });
                    if (resolved.details) details.push(resolved.details);
                });
            });

            return {
                impact: impact,
                details: details.join('. ')
            };
        }

        function sumSpecialRewardImpact() {
            var total = emptyRewardImpact();
            if (!rollOutcomes) return total;

            var nodes = rollOutcomes.querySelectorAll('[data-special-outcome="1"]');
            nodes.forEach(function (node) {
                var gold = toInt(node.getAttribute('data-reward-gold'), 0);
                var shards = toInt(node.getAttribute('data-reward-shards'), 0);
                total.gold += Math.max(0, gold);
                total.shards += Math.max(0, shards);

                var itemCsv = node.getAttribute('data-reward-items') || '';
                if (!itemCsv) return;
                itemCsv.split('|').forEach(function (entry) {
                    var clean = String(entry || '').trim();
                    if (clean) total.items.push(clean);
                });
            });

            return total;
        }

        function toItemsCsv(items) {
            var counts = new Map();
            (Array.isArray(items) ? items : []).forEach(function (name) {
                var key = normalizeItemName(name);
                if (!key) return;
                var current = counts.get(key) || { count: 0, label: titleCaseWords(key) };
                current.count += 1;
                counts.set(key, current);
            });

            return Array.from(counts.values()).map(function (entry) {
                if (entry.count > 1) return entry.count + ' x ' + entry.label;
                return entry.label;
            }).join(', ');
        }

        function setItemsCsvByNames(itemNames) {
            if (!itemsCsvInput) return;
            itemsCsvInput.value = toItemsCsv(itemNames);
            if (window.M && M.updateTextFields) M.updateTextFields();
        }

        function resolveSpecialRoll(entry) {
            var roll = entry && entry.roll;
            if (!roll || !roll.type) {
                var fallback = rollDie(6);
                return {
                    text: 'Rolled D6: ' + fallback + '. No structured sub-roll is configured; apply the result text manually.',
                    reward: emptyRewardImpact()
                };
            }

            if (roll.type === 'd6gc') {
                var d6 = rollDie(6);
                var parts = ['Rolled D6: ' + d6 + ' -> Gain ' + d6 + ' gc'];
                var impact = { gold: d6, shards: 0, items: [] };
                if (roll.bonus && roll.bonus[d6]) {
                    var bonusText = String(roll.bonus[d6]);
                    parts.push(bonusText);
                    if (/lucky\s+charm/i.test(bonusText)) impact.items.push('Lucky Charm');
                }
                return { text: parts.join('. '), reward: impact };
            }

            if (roll.type === 'd6') {
                var die = rollDie(6);
                var outcome = roll[die];
                if (!outcome || !outcome.reward) {
                    return {
                        text: 'Rolled D6: ' + die + '. No mapped reward found.',
                        reward: emptyRewardImpact()
                    };
                }

                if (outcome.reward === 'd6gc') {
                    var goldD6 = rollDie(6);
                    return {
                        text: 'Rolled D6: ' + die + ' -> Reward: D6 gc (' + goldD6 + ' gc).',
                        reward: { gold: goldD6, shards: 0, items: [] }
                    };
                }

                if (outcome.reward === '2d6gc') {
                    var twoD6 = rollDice(2, 6);
                    return {
                        text: 'Rolled D6: ' + die + ' -> Reward: 2D6 gc (' + twoD6.values.join(' + ') + ' = ' + twoD6.total + ' gc).',
                        reward: { gold: twoD6.total, shards: 0, items: [] }
                    };
                }

                var tokens = splitRewardTokens(outcome.reward);
                if (tokens.length > 1) {
                    var aggregate = emptyRewardImpact();
                    var tokenDetails = [];
                    tokens.forEach(function (token) {
                        var resolved = applyTokenReward(token);
                        aggregate.gold += resolved.impact.gold;
                        aggregate.shards += resolved.impact.shards;
                        aggregate.pendingMapQuality += resolved.impact.pendingMapQuality || 0;
                        resolved.impact.items.forEach(function (itemName) { aggregate.items.push(itemName); });
                        if (resolved.details) tokenDetails.push(resolved.details);
                    });

                    var message = 'Rolled D6: ' + die + ' -> Reward: ' + tokens.map(rewardText).join(', ') + '.';
                    if (tokenDetails.length) message += ' ' + tokenDetails.join('. ') + '.';
                    return { text: message, reward: aggregate };
                }

                if (/^[a-z0-9_]+$/i.test(String(outcome.reward || ''))) {
                    var singleResolved = applyTokenReward(outcome.reward);
                    var singleMessage = 'Rolled D6: ' + die + ' -> Reward: ' + rewardText(outcome.reward) + '.';
                    if (singleResolved.details) singleMessage += ' ' + singleResolved.details + '.';
                    return { text: singleMessage, reward: singleResolved.impact };
                }

                return {
                    text: 'Rolled D6: ' + die + ' -> Reward: ' + rewardText(outcome.reward) + '.',
                    reward: { gold: 0, shards: 0, items: [rewardText(outcome.reward)] }
                };
            }

            if (roll.type === 'toughness') {
                var testRoll = rollDie(6);
                return {
                    text: 'Rolled D6: ' + testRoll + '. Compare to the selected Hero Toughness. If D6 <= Toughness: ' + (roll.pass || 'Pass effect applies') + '.',
                    reward: emptyRewardImpact()
                };
            }

            if (roll.type === 'test') {
                return {
                    text: 'Use Roll Test with a selected Hero to resolve this test.',
                    reward: emptyRewardImpact()
                };
            }

            if (roll.type === 'warband') {
                var warbandNameLower = String((warbandInput && warbandInput.value) || '').trim().toLowerCase();
                var choice = null;

                if (warbandNameLower && roll[warbandNameLower]) {
                    choice = roll[warbandNameLower];
                }

                if (!choice && warbandNameLower) {
                    Object.keys(roll).forEach(function (key) {
                        if (choice) return;
                        if (key === 'type' || key === 'default') return;
                        if (warbandNameLower.indexOf(String(key).toLowerCase()) !== -1) {
                            choice = roll[key];
                        }
                    });
                }

                if (!choice) choice = roll.default || null;
                if (!choice || !choice.reward) {
                    return {
                        text: 'No mapped warband reward found for "' + (warbandInput && warbandInput.value ? warbandInput.value : 'Unknown Warband') + '".',
                        reward: emptyRewardImpact()
                    };
                }

                if (choice.reward === '2d6gc') {
                    var warbandGold = rollDice(2, 6);
                    return {
                        text: 'Warband: ' + (warbandInput && warbandInput.value ? warbandInput.value : 'Unknown') + ' -> Reward: 2D6 gc (' + warbandGold.values.join(' + ') + ' = ' + warbandGold.total + ' gc).',
                        reward: { gold: warbandGold.total, shards: 0, items: [] }
                    };
                }

                var warbandTokens = splitRewardTokens(choice.reward);
                if (warbandTokens.length > 1) {
                    var warbandImpact = emptyRewardImpact();
                    var warbandDetails = [];
                    warbandTokens.forEach(function (token) {
                        var resolved = applyTokenReward(token);
                        warbandImpact.gold += resolved.impact.gold;
                        warbandImpact.shards += resolved.impact.shards;
                        warbandImpact.pendingMapQuality += resolved.impact.pendingMapQuality || 0;
                        resolved.impact.items.forEach(function (itemName) { warbandImpact.items.push(itemName); });
                        if (resolved.details) warbandDetails.push(resolved.details);
                    });

                    var warbandMessage = 'Warband: ' + (warbandInput && warbandInput.value ? warbandInput.value : 'Unknown')
                        + ' -> Reward: ' + warbandTokens.map(rewardText).join(', ') + '.';
                    if (warbandDetails.length) warbandMessage += ' ' + warbandDetails.join('. ') + '.';
                    return { text: warbandMessage, reward: warbandImpact };
                }

                if (/^[a-z0-9_]+$/i.test(String(choice.reward || ''))) {
                    var warbandResolved = applyTokenReward(choice.reward);
                    var singleWarbandMessage = 'Warband: ' + (warbandInput && warbandInput.value ? warbandInput.value : 'Unknown')
                        + ' -> Reward: ' + rewardText(choice.reward) + '.';
                    if (warbandResolved.details) singleWarbandMessage += ' ' + warbandResolved.details + '.';
                    return { text: singleWarbandMessage, reward: warbandResolved.impact };
                }

                return {
                    text: 'Warband: ' + (warbandInput && warbandInput.value ? warbandInput.value : 'Unknown') + ' -> Reward: ' + rewardText(choice.reward) + '.',
                    reward: { gold: 0, shards: 0, items: [rewardText(choice.reward)] }
                };
            }

            return {
                text: 'No resolver for roll type "' + String(roll.type) + '" yet. Use the rule text manually.',
                reward: emptyRewardImpact()
            };
        }

        function getSelectedRosterId() {
            if (!rosterSelect) return '';
            return String(rosterSelect.value || '').trim();
        }

        function getRosterHeroes(rosterId) {
            var list = rosterMembersData && rosterMembersData[rosterId];
            return Array.isArray(list) ? list : [];
        }

        function initSelectUi(selectEl) {
            if (!selectEl || !window.M || !M.FormSelect) return;
            M.FormSelect.init(selectEl);
        }

        function buildTestUi(entry, wrapper, resultNode) {
            var roll = entry && entry.roll ? entry.roll : {};
            var statKey = String(roll.stat || '').toLowerCase();
            var statLabel = STAT_LABELS[statKey] || statKey.toUpperCase();

            var testBox = document.createElement('div');
            testBox.style.marginTop = '6px';

            var memberField = document.createElement('div');
            memberField.className = 'input-field';
            memberField.style.marginTop = '0';

            var memberSelect = document.createElement('select');
            memberSelect.className = 'browser-default';
            memberSelect.style.maxWidth = '320px';

            var statInfo = document.createElement('div');
            statInfo.className = 'grey-text text-darken-2';
            statInfo.style.marginTop = '6px';

            var rollTestButton = document.createElement('button');
            rollTestButton.type = 'button';
            rollTestButton.className = 'btn-small waves-effect waves-light teal';
            rollTestButton.style.marginTop = '8px';
            rollTestButton.textContent = 'Roll Test';

            function refreshMemberOptions() {
                var rosterId = getSelectedRosterId();
                var heroes = getRosterHeroes(rosterId);
                memberSelect.innerHTML = '';

                var placeholder = document.createElement('option');
                placeholder.value = '';
                placeholder.textContent = heroes.length ? 'Select Hero' : 'No heroes available for selected roster';
                memberSelect.appendChild(placeholder);

                heroes.forEach(function (hero) {
                    var option = document.createElement('option');
                    option.value = String(hero._id || '');
                    option.textContent = String(hero.name || 'Hero');
                    var statValue = hero && hero.stats ? toInt(hero.stats[statKey], 0) : 0;
                    option.setAttribute('data-stat', String(Math.max(0, statValue)));
                    memberSelect.appendChild(option);
                });

                memberSelect.selectedIndex = 0;
                updateStatDisplay();
                initSelectUi(memberSelect);
            }

            function updateStatDisplay() {
                var selected = memberSelect.options[memberSelect.selectedIndex];
                var heroName = selected && selected.value ? selected.textContent : 'No hero selected';
                var statValue = selected && selected.value ? Math.max(0, toInt(selected.getAttribute('data-stat'), 0)) : 0;
                if (!selected || !selected.value) {
                    statInfo.textContent = statLabel + ': -';
                    rollTestButton.disabled = true;
                    return;
                }

                statInfo.textContent = heroName + ' - ' + statLabel + ': ' + statValue;
                rollTestButton.disabled = false;
            }

            memberSelect.addEventListener('change', function () {
                updateStatDisplay();
            });

            if (rosterSelect) {
                rosterSelect.addEventListener('change', function () {
                    refreshMemberOptions();
                    resultNode.style.display = 'none';
                    resultNode.textContent = '';
                    wrapper.setAttribute('data-reward-gold', '0');
                    wrapper.setAttribute('data-reward-shards', '0');
                    wrapper.setAttribute('data-reward-items', '');
                    updateTotalRewardsDisplay();
                });
            }

            rollTestButton.addEventListener('click', function () {
                var selected = memberSelect.options[memberSelect.selectedIndex];
                if (!selected || !selected.value) {
                    if (window.M && M.toast) M.toast({ html: 'Select a Hero first.' });
                    return;
                }

                var statValue = Math.max(0, toInt(selected.getAttribute('data-stat'), 0));
                var isLeadershipTest = statKey === 'ld';
                var testRoll = isLeadershipTest ? rollDice(2, 6) : { values: [rollDie(6)], total: 0 };
                if (!testRoll.total) {
                    testRoll.total = testRoll.values[0];
                }

                var success = testRoll.total <= statValue;
                var outcomeText = success ? String(roll.pass || '') : String(roll.fail || '');
                var parsedOutcome = rewardImpactFromText(outcomeText);
                var impact = parsedOutcome.impact;

                wrapper.setAttribute('data-reward-gold', String(impact.gold));
                wrapper.setAttribute('data-reward-shards', String(impact.shards));
                wrapper.setAttribute('data-reward-items', Array.isArray(impact.items) ? impact.items.join('|') : '');

                var testText = isLeadershipTest
                    ? ('Rolled 2D6: ' + testRoll.values.join(' + ') + ' = ' + testRoll.total)
                    : ('Rolled D6: ' + testRoll.total);

                var text = testText + ' vs ' + statLabel + ' ' + statValue + ' -> ' + (success ? 'Success' : 'Failure') + '.';
                if (outcomeText) text += ' ' + outcomeText + '.';
                if (parsedOutcome.details) text += ' ' + parsedOutcome.details + '.';
                resultNode.textContent = text;
                resultNode.style.display = 'block';
                updateTotalRewardsDisplay();
            });

            memberField.appendChild(memberSelect);
            testBox.appendChild(memberField);
            testBox.appendChild(statInfo);
            testBox.appendChild(rollTestButton);

            refreshMemberOptions();
            return testBox;
        }

        function buildSpecialOutcomeNode(entry) {
            var wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';
            wrapper.setAttribute('data-special-outcome', '1');
            wrapper.setAttribute('data-reward-gold', '0');
            wrapper.setAttribute('data-reward-shards', '0');
            wrapper.setAttribute('data-reward-items', '');
            wrapper.setAttribute('data-reward-pending-map-quality', '0');

            var heading = document.createElement('strong');
            heading.textContent = entry.label + ': ' + entry.title;
            wrapper.appendChild(heading);

            var body = document.createElement('div');
            body.className = 'grey-text text-darken-2';
            body.style.marginTop = '2px';
            body.textContent = entry.description;
            wrapper.appendChild(body);

            var actionRow = document.createElement('div');
            actionRow.style.marginTop = '6px';

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn-small waves-effect waves-light blue-grey';
            button.textContent = 'Roll Result';

            var result = document.createElement('div');
            result.className = 'grey-text text-darken-3';
            result.style.marginTop = '6px';
            result.style.display = 'none';

            var mapQualityActions = document.createElement('div');
            mapQualityActions.style.marginTop = '8px';
            mapQualityActions.style.display = 'none';

            function getWrapperItems() {
                var itemCsv = wrapper.getAttribute('data-reward-items') || '';
                if (!itemCsv) return [];
                return itemCsv.split('|').map(function (entry) {
                    return String(entry || '').trim();
                }).filter(function (entry) {
                    return entry.length > 0;
                });
            }

            function setWrapperItems(items) {
                var list = Array.isArray(items) ? items : [];
                wrapper.setAttribute('data-reward-items', list.join('|'));
            }

            function renderMapQualityButtons(pendingCount) {
                mapQualityActions.innerHTML = '';
                if (!pendingCount || pendingCount < 1) {
                    mapQualityActions.style.display = 'none';
                    wrapper.setAttribute('data-reward-pending-map-quality', '0');
                    return;
                }

                mapQualityActions.style.display = 'block';
                wrapper.setAttribute('data-reward-pending-map-quality', String(pendingCount));

                for (var idx = 0; idx < pendingCount; idx++) {
                    var mapButton = document.createElement('button');
                    mapButton.type = 'button';
                    mapButton.className = 'btn-small waves-effect waves-light blue';
                    mapButton.style.marginRight = '6px';
                    mapButton.style.marginBottom = '6px';
                    mapButton.textContent = 'Roll Map Quality';

                    mapButton.addEventListener('click', function () {
                        var rolled = rollMordheimMapQuality();
                        var currentItems = getWrapperItems();
                        currentItems.push(rolled.label);
                        setWrapperItems(currentItems);

                        var remaining = Math.max(0, toInt(wrapper.getAttribute('data-reward-pending-map-quality'), 0) - 1);
                        wrapper.setAttribute('data-reward-pending-map-quality', String(remaining));

                        if (result.textContent) {
                            result.textContent += ' Map quality D6: ' + rolled.roll + ' -> ' + rolled.label + '.';
                        } else {
                            result.textContent = 'Map quality D6: ' + rolled.roll + ' -> ' + rolled.label + '.';
                            result.style.display = 'block';
                        }

                        mapButton.disabled = true;
                        mapButton.classList.remove('blue');
                        mapButton.classList.add('grey');
                        updateTotalRewardsDisplay();
                    });

                    mapQualityActions.appendChild(mapButton);
                }
            }

            if (entry && entry.roll && entry.roll.type === 'test') {
                var testUi = buildTestUi(entry, wrapper, result);
                wrapper.appendChild(testUi);
            } else {
                button.addEventListener('click', function () {
                    var rollResult = resolveSpecialRoll(entry);
                    var impact = rollResult && rollResult.reward ? rollResult.reward : emptyRewardImpact();
                    wrapper.setAttribute('data-reward-gold', String(Math.max(0, toInt(impact.gold, 0))));
                    wrapper.setAttribute('data-reward-shards', String(Math.max(0, toInt(impact.shards, 0))));
                    wrapper.setAttribute('data-reward-items', Array.isArray(impact.items) ? impact.items.join('|') : '');
                    wrapper.setAttribute('data-reward-pending-map-quality', String(Math.max(0, toInt(impact.pendingMapQuality, 0))));
                    setItemsCsvByNames(impact.items || []);
                    renderMapQualityButtons(Math.max(0, toInt(impact.pendingMapQuality, 0)));

                    result.textContent = rollResult && rollResult.text ? rollResult.text : 'No roll result.';
                    result.style.display = 'block';
                    updateTotalRewardsDisplay();
                });

                actionRow.appendChild(button);
                wrapper.appendChild(actionRow);
            }
            wrapper.appendChild(result);
            wrapper.appendChild(mapQualityActions);

            return wrapper;
        }

        function renderSpecialOutcomes(outcomes) {
            if (!rollOutcomes) return;
            if (!outcomes || !outcomes.length) {
                rollOutcomes.innerHTML = '';
                rollOutcomes.style.display = 'none';
                return;
            }

            rollOutcomes.innerHTML = '';
            var title = document.createElement('strong');
            title.textContent = 'Special Outcomes:';
            rollOutcomes.appendChild(title);

            var list = document.createElement('div');
            list.style.marginTop = '6px';
            outcomes.forEach(function (entry) {
                list.appendChild(buildSpecialOutcomeNode(entry));
            });

            rollOutcomes.appendChild(list);
            rollOutcomes.style.display = 'block';
        }

        function calcWyrdstoneFromTotal(total) {
            if (total >= 36) return 7;
            if (total >= 31) return 6;
            if (total >= 25) return 5;
            if (total >= 18) return 4;
            if (total >= 12) return 3;
            if (total >= 6) return 2;
            if (total >= 1) return 1;
            return 0;
        }

        function updateTotalRewardsDisplay() {
            if (!totalRewards) return;
            var baseGold = Math.max(0, toInt(goldInput && goldInput.value, 0));
            var baseShards = Math.max(0, toInt(wyrdstoneInput && wyrdstoneInput.value, 0));
            var special = sumSpecialRewardImpact();

            var gold = baseGold + special.gold;
            var shards = baseShards + special.shards;

            var line = gold + ' gc + ' + shards + ' shards';
            if (special.items.length) {
                line += ' + Items: ' + special.items.join(', ');
            }
            totalRewards.textContent = line;

            setItemsCsvByNames(special.items);

            if (submissionGoldInput) submissionGoldInput.value = String(gold);
            if (submissionWyrdstoneInput) submissionWyrdstoneInput.value = String(shards);
        }

        function clearRollData() {
            if (rollList) rollList.textContent = '';
            if (rollTotal) rollTotal.textContent = '0';
            if (rollMatches) rollMatches.textContent = 'None';
            renderSpecialOutcomes([]);
            if (rollShards) rollShards.textContent = '0';
            if (wyrdstoneInput) wyrdstoneInput.value = '0';
            updateTotalRewardsDisplay();
            if (output) output.style.display = 'none';
            if (hiddenRolls) hiddenRolls.value = '';
            if (hiddenTotal) hiddenTotal.value = '0';
            if (hiddenDice) hiddenDice.value = '0';
            if (window.M && M.updateTextFields) M.updateTextFields();
        }

        function applyExplorationRolls(rolls, bonusDice, totalDice, sourceLabel) {
            var total = 0;
            for (var i = 0; i < rolls.length; i++) {
                total += rolls[i];
            }

            if (rollList) {
                rollList.textContent = rolls.join(' + ');
                if (bonusDice) {
                    rollList.textContent += ' (includes +1 bonus die)';
                }
                if (sourceLabel === 'manual') {
                    rollList.textContent += ' (manual entry)';
                }
            }

            if (rollTotal) rollTotal.textContent = String(total);
            var analysis = analyzeMatches(rolls);
            if (rollMatches) rollMatches.textContent = analysis.summary;
            renderSpecialOutcomes(analysis.outcomes);

            var shards = calcWyrdstoneFromTotal(total);
            if (rollShards) rollShards.textContent = String(shards);
            if (wyrdstoneInput) wyrdstoneInput.value = String(shards);
            updateTotalRewardsDisplay();
            if (output) output.style.display = 'block';

            if (hiddenRolls) hiddenRolls.value = rolls.join(',');
            if (hiddenTotal) hiddenTotal.value = String(total);
            if (hiddenDice) hiddenDice.value = String(totalDice);
            if (window.M && M.updateTextFields) M.updateTextFields();
        }

        function promptForDiceText(totalDice) {
            var current = hiddenRolls && hiddenRolls.value ? hiddenRolls.value : '';
            var message = 'Enter ' + totalDice + ' die results (1-6), comma separated. Example: 6,3,1';

            if (window.popouts && typeof window.popouts.prompt === 'function') {
                return window.popouts.prompt(message, current);
            }
            return Promise.resolve(window.prompt(message, current));
        }

        function parseManualDiceInput(text, expectedCount) {
            if (text === null || text === undefined) return { ok: false, cancelled: true };
            var raw = String(text).trim();
            if (!raw.length) return { ok: false, message: 'No dice were entered.' };

            var parts = raw.split(/[\s,;|]+/).filter(function (p) { return p.length > 0; });
            if (parts.length !== expectedCount) {
                return { ok: false, message: 'Expected ' + expectedCount + ' dice, got ' + parts.length + '.' };
            }

            var rolls = [];
            for (var i = 0; i < parts.length; i++) {
                var value = toInt(parts[i], -1);
                if (value < 1 || value > 6) {
                    return { ok: false, message: 'Dice must be between 1 and 6.' };
                }
                rolls.push(value);
            }

            return { ok: true, rolls: rolls };
        }

        function rollExploration() {
            var heroDice = Math.max(0, toInt(heroCountInput && heroCountInput.value, 0));
            var bonusDice = winBonusInput && winBonusInput.checked ? 1 : 0;
            var totalDice = heroDice + bonusDice;

            if (totalDice <= 0) {
                clearRollData();
                if (window.M && M.toast) M.toast({ html: 'Set at least one die to roll.' });
                return;
            }

            var rolls = [];
            for (var i = 0; i < totalDice; i++) {
                var value = Math.floor(Math.random() * 6) + 1;
                rolls.push(value);
            }

            applyExplorationRolls(rolls, bonusDice, totalDice, 'random');
        }

        function enterManualDice() {
            var heroDice = Math.max(0, toInt(heroCountInput && heroCountInput.value, 0));
            var bonusDice = winBonusInput && winBonusInput.checked ? 1 : 0;
            var totalDice = heroDice + bonusDice;

            if (totalDice <= 0) {
                clearRollData();
                if (window.M && M.toast) M.toast({ html: 'Set at least one die before entering results.' });
                return;
            }

            promptForDiceText(totalDice).then(function (input) {
                var parsed = parseManualDiceInput(input, totalDice);
                if (parsed.cancelled) return;
                if (!parsed.ok) {
                    if (window.M && M.toast) M.toast({ html: parsed.message || 'Invalid dice input.' });
                    return;
                }
                applyExplorationRolls(parsed.rolls, bonusDice, totalDice, 'manual');
            });
        }

        if (rosterSelect) {
            rosterSelect.addEventListener('change', function () {
                setDefaultsFromRoster();
                clearRollData();
            });
        }

        if (heroCountInput) {
            heroCountInput.addEventListener('input', clearRollData);
        }

        if (winBonusInput) {
            winBonusInput.addEventListener('change', clearRollData);
        }

        if (goldInput) {
            goldInput.addEventListener('input', updateTotalRewardsDisplay);
        }

        if (rollButton) {
            rollButton.addEventListener('click', rollExploration);
        }

        if (enterDiceButton) {
            enterDiceButton.addEventListener('click', enterManualDice);
        }

        setDefaultsFromRoster();
        clearRollData();
        updateTotalRewardsDisplay();
    }

    function initInjuryWidget(root) {
        var scope = root || document;
        var form = scope.querySelector('#injury-form');
        if (!form || form.dataset.injuryBound === '1') return;
        form.dataset.injuryBound = '1';

        var rosterSelect = form.querySelector('#injury-roster');
        var memberSelect = form.querySelector('#injury-member');
        var injuryTypeSelect = form.querySelector('#injury-type');
        if (!rosterSelect || !memberSelect || !injuryTypeSelect) return;

        var baseOptions = Array.prototype.slice.call(memberSelect.querySelectorAll('option')).map(function (opt) {
            return {
                value: opt.value,
                label: opt.textContent,
                rosterId: opt.getAttribute('data-roster-id') || '',
                unitType: opt.getAttribute('data-unit-type') || '',
                disabled: !!opt.disabled
            };
        });
        var baseInjuryOptions = Array.prototype.slice.call(injuryTypeSelect.querySelectorAll('option')).map(function (opt) {
            return {
                value: opt.value,
                label: opt.textContent,
                disabled: !!opt.disabled
            };
        });

        function reinitSelect(selectEl) {
            if (!selectEl || !window.M || !M.FormSelect) return;
            var instance = M.FormSelect.getInstance(selectEl);
            if (instance) instance.destroy();
            M.FormSelect.init(selectEl);
        }

        function refreshInjuryTypeSelect() {
            var selectedMember = memberSelect.options[memberSelect.selectedIndex];
            var unitType = selectedMember ? String(selectedMember.getAttribute('data-unit-type') || '') : '';
            var isHenchman = unitType === '2';

            injuryTypeSelect.innerHTML = '';

            var placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.disabled = true;
            placeholder.selected = true;
            placeholder.textContent = 'Choose injury';
            injuryTypeSelect.appendChild(placeholder);

            var allowed = baseInjuryOptions.filter(function (entry) {
                if (!entry.value) return false;
                if (!isHenchman) return true;
                return entry.value === '1' || entry.value === '14';
            });

            allowed.forEach(function (entry) {
                var option = document.createElement('option');
                option.value = entry.value;
                option.textContent = entry.label;
                injuryTypeSelect.appendChild(option);
            });

            if (!allowed.length || !selectedMember || !selectedMember.value) {
                injuryTypeSelect.disabled = true;
            } else {
                injuryTypeSelect.disabled = false;
            }

            reinitSelect(injuryTypeSelect);
        }

        function refreshMemberSelect() {
            var selectedRosterId = String(rosterSelect.value || '').trim();
            memberSelect.innerHTML = '';

            var placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.disabled = true;
            placeholder.textContent = selectedRosterId ? 'Choose member' : 'Choose roster first';
            memberSelect.appendChild(placeholder);

            var visible = baseOptions.filter(function (entry) {
                if (!entry.value) return false;
                return selectedRosterId && String(entry.rosterId) === selectedRosterId;
            });

            visible.forEach(function (entry) {
                var option = document.createElement('option');
                option.value = entry.value;
                option.textContent = entry.label;
                option.setAttribute('data-roster-id', entry.rosterId);
                option.setAttribute('data-unit-type', entry.unitType);
                memberSelect.appendChild(option);
            });

            if (visible.length) {
                memberSelect.selectedIndex = 1;
                memberSelect.disabled = false;
                placeholder.selected = false;
            } else {
                memberSelect.selectedIndex = 0;
                placeholder.selected = true;
                memberSelect.disabled = true;
            }

            reinitSelect(memberSelect);
            refreshInjuryTypeSelect();
        }

        rosterSelect.addEventListener('change', refreshMemberSelect);
        memberSelect.addEventListener('change', refreshInjuryTypeSelect);
        refreshMemberSelect();
    }

    window.initExplorationWidget = initExplorationWidget;
    window.initInjuryWidget = initInjuryWidget;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initExplorationWidget(document);
            initInjuryWidget(document);
        });
    } else {
        initExplorationWidget(document);
        initInjuryWidget(document);
    }
})();
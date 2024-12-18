import { test, describe, expect, vi } from 'vitest';

import { handleDawn, handleDusk, handleNightKill, killPlayerByIndex } from '../../src/game/core';
import roles from '../../src/data/roles';

import { GameState } from '../../src/App';
import pseudonyms from '../../src/data/pseudonyms';
import { countEvilPairs, defaultGameState, findPlayersNeighbours, isPlayerEvil, isPlayerMinion, isPlayerOutsider, isPlayerVillager, isPlayerWerewolf, Result } from '../../src/game/utils';
import statuses from '../../src/data/statuses';
import { PlayerType, PlayState, Team } from '../../src/enums';
import { handleHunterAbility } from '../../src/game/Hunter';

const intoxications = ['Drunk', 'Poisoned'];

describe('Artist', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

});

describe('Butler', () => {

    // PREVENT VOTING
    test.skip('Ability', () => {
        // TODO
        // TODO poison (cannot be Drunk)
    });

});

describe('Chef', () => {
    const playerIndicies = [
        [1, 3], [1, 2], [1, 2, 3]
    ];

    // ABILITY
    test.each([0, 1, 2])('%i Evil pairs', async (i) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Chef');

        playerIndicies[i].forEach(index => {
            mockGameState.players[index].role = roles.find(r => r.type === PlayerType.WEREWOLF);
        });

        const evilPairsCount = await countEvilPairs(mockGameState,vi.fn());

        expect(evilPairsCount).toBe(i);
    });
});

describe('Doctor', () => {

    // ABILITY
    test('Werewolf kill immunity', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[1].statuses = [
            statuses['Targeted'], statuses['Protected'],
        ];

        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(1, mockGameState, [], vi.fn());

        expect(murder).toBe(false);
        expect(updatedGameState.players[1].alive).toBe(true);
        expect(temp).toBe('protected');
    });

    test.each(intoxications)('Werewolf kill immunity fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        const status = {...statuses['Protected']};
        status.drunk = intoxication === 'Drunk';
        status.poisoned = intoxication === 'Poisoned';
        mockGameState.players[1].statuses = [
            statuses['Targeted'], status,
        ];

        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(1, mockGameState, [], vi.fn());

        expect(murder).toBe(true);
        expect(updatedGameState.players[1].alive).toBe(false);
        expect(temp).toBe('');
    });

});

describe('Empath', () => {
    const playerIndicies = [
        [Team.GOOD, Team.GOOD], [Team.EVIL, Team.GOOD], [Team.EVIL, Team.EVIL]
    ];

    // ABILITY
    test.each([0, 1, 2])('%i Evil neighbours', async (i) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Empath');

        mockGameState.players[1].role = roles.find(r => r.team === playerIndicies[i][0]);
        mockGameState.players[4].role = roles.find(r => r.team === playerIndicies[i][1]);

        const neighbours = findPlayersNeighbours(mockGameState, 0);

        expect(neighbours.filter(p => isPlayerEvil(mockGameState.players[p]) === Result.TRUE).length).toBe(i);
    });
});

describe('Fool', () => {

    // CHEAT DEATH
    test('Cheat death', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Fool');

        expect(mockGameState.players[0].alive).toBe(true);

        const updatedGameState = killPlayerByIndex(0, mockGameState);

        expect(updatedGameState.players[0].alive).toBe(true);
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Fool');
        mockGameState.players[0].statuses = [statuses[intoxication]];

        expect(mockGameState.players[0].alive).toBe(true);

        const updatedGameState = killPlayerByIndex(0, mockGameState);

        expect(updatedGameState.players[0].alive).toBe(false);
    });

    test('Ability fail (multiple uses)', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Fool');

        expect(mockGameState.players[0].alive).toBe(true);

        let updatedGameState = killPlayerByIndex(0, mockGameState);

        expect(updatedGameState.players[0].alive).toBe(true);

        updatedGameState = killPlayerByIndex(0, mockGameState);

        expect(updatedGameState.players[0].alive).toBe(false);
    });

});

describe('Gambler', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Hunter', () => {

    const initialGameState: GameState = defaultGameState(5, pseudonyms);
    initialGameState.state = 'special';
    initialGameState.special = { state: 'Hunter', previous: PlayState.PLAYING };

    initialGameState.players[0].role = roles.find(r => r.name === 'Hunter');

    // ABILITY
    test('Shoot Werewolf', async () => {
        const mockSetGameState = vi.fn();
        const mockGameState: GameState = JSON.parse(JSON.stringify(initialGameState));
        mockGameState.players[1].role = roles.find(r => r.type === PlayerType.WEREWOLF);

        expect(mockGameState.players[1].alive).toBe(true);

        await handleHunterAbility(mockGameState, [1], mockSetGameState, vi.fn(), vi.fn(), vi.fn());
        const updatedGameState: GameState = mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.players[1].alive).toBe(false);
    });

    test.each(intoxications)('Shoot Werewolf fail (%s)', async (intoxication) => {
        const mockSetGameState = vi.fn();
        const mockGameState: GameState = JSON.parse(JSON.stringify(initialGameState));

        mockGameState.players[0].statuses.push(statuses[intoxication]);

        mockGameState.players[1].role = roles.find(r => r.type === PlayerType.WEREWOLF);

        expect(mockGameState.players[1].alive).toBe(true);

        await handleHunterAbility(mockGameState, [1], mockSetGameState, vi.fn(), vi.fn(), vi.fn());
        const updatedGameState: GameState = mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.players[1].alive).toBe(true);
    });

    test.each([PlayerType.VILLAGER, PlayerType.OUTSIDER, PlayerType.MINION])('Shoot non-Werewolf (%s)', async (playerType) => {
        const mockSetGameState = vi.fn();
        const mockGameState: GameState = JSON.parse(JSON.stringify(initialGameState));

        mockGameState.players[1].role = roles.find(r => r.type === playerType);

        expect(mockGameState.players[1].alive).toBe(true);

        await handleHunterAbility(mockGameState, [1], mockSetGameState, vi.fn(), vi.fn(), vi.fn());
        const updatedGameState: GameState = mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.players[1].alive).toBe(true);
    });

    test('Shoot Werewolf (dead)', async () => {
        const mockSetGameState = vi.fn();
        const mockGameState: GameState = JSON.parse(JSON.stringify(initialGameState));

        mockGameState.players[1].alive = false;
        mockGameState.players[1].role = roles.find(r => r.type === PlayerType.WEREWOLF);

        expect(mockGameState.players[1].alive).toBe(false);

        await handleHunterAbility(mockGameState, [1], mockSetGameState, vi.fn(), vi.fn(), vi.fn());
        const updatedGameState: GameState = mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.players[1].alive).toBe(false);
    });

});

describe('Investigator', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Librarian', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Mayor', () => {

    // CHEAT DEATH
    test('Cheat death', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Mayor');
        mockGameState.players[0].statuses = [statuses['Targeted']];

        const mockShowPrompt = vi.fn();
        mockShowPrompt.mockResolvedValue(mockGameState.players[1].name);

        expect(mockGameState.players[0].alive).toBe(true);
        expect(mockGameState.players[1].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(0, mockGameState, [], mockShowPrompt);

        // mayor alive
        expect(updatedGameState.players[0].alive).toBe(true);
        // other player dead
        expect(murder).toBe(true);
        expect(updatedGameState.players[1].alive).toBe(false);
        expect(temp).toBe('');
    });

    test.each([...intoxications, 'Storyteller Choice'])('Cheat death fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Mayor');
        const status = statuses[intoxication];
        mockGameState.players[0].statuses = [statuses['Targeted']];
        if (status) {
            mockGameState.players[0].statuses.push(status);
        }

        const mockShowPrompt = vi.fn();
        mockShowPrompt.mockResolvedValue(intoxication !== 'Storyteller Choice' ? mockGameState.players[1].name : null);

        expect(mockGameState.players[0].alive).toBe(true);
        expect(mockGameState.players[1].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(0, mockGameState, [], mockShowPrompt);

        // other player alive
        expect(updatedGameState.players[1].alive).toBe(true);
        // mayor dead
        expect(murder).toBe(true);
        expect(updatedGameState.players[0].alive).toBe(false);
        expect(temp).toBe('');
    });

    // WIN CONDITION
    test('Villager win', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Mayor');

        mockGameState.players[4].alive = false;
        mockGameState.players[3].alive = false;

        const updatedGameState = handleDusk(mockGameState, vi.fn());

        expect(updatedGameState?.state).toBe(PlayState.VICTORY);
    });

    test.each(intoxications)('Villager win fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Mayor');
        mockGameState.players[0].statuses = [statuses[intoxication]];

        mockGameState.players[4].alive = false;
        mockGameState.players[3].alive = false;

        const updatedGameState = handleDusk(mockGameState, vi.fn());

        expect(updatedGameState?.state).not.toBe(PlayState.VICTORY);
    });

    test('Villager win fail (execution)', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Mayor');

        mockGameState.players[4].alive = false;
        mockGameState.players[3].alive = false;

        mockGameState.choppingBlock = { playerName: mockGameState.players[1].name, votes: 2 };

        expect(mockGameState?.players[1].alive).toBe(true);

        const updatedGameState = handleDusk(mockGameState, vi.fn());

        expect(updatedGameState?.state).not.toBe(PlayState.VICTORY);
        expect(updatedGameState?.players[1].alive).toBe(false);
    });

});

describe('Nain', () => {

    // GRIEF DEATH
    test('Grief death', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Nain');

        mockGameState.players[1].statuses = [statuses['Grandchild'], statuses['Targeted']];

        expect(mockGameState.players[1].alive).toBe(true);
        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState] = await handleNightKill(1, mockGameState, [], vi.fn());

        expect(updatedGameState.players[0].alive).toBe(false);
        expect(updatedGameState.players[1].alive).toBe(false);
    });

    test.each(intoxications)('Grief death fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Nain');
        mockGameState.players[0].statuses.push(statuses[intoxication]);

        mockGameState.players[1].statuses = [statuses['Grandchild'], statuses['Targeted']];

        expect(mockGameState.players[1].alive).toBe(true);
        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState] = await handleNightKill(1, mockGameState, [], vi.fn());

        expect(updatedGameState.players[0].alive).toBe(true);
        expect(updatedGameState.players[1].alive).toBe(false);
    });

    // LEARN GRANDCHILD
    test.skip('Learn grandchild', () => {
        // TODO
        // TODO intoxication
    });

});

describe('Ravenkeeper', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

});

describe('Recluse', () => {

    // SOMETIMES PING AS EVIL
    test('Evil ping', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Recluse');

        expect(isPlayerEvil(mockGameState.players[0])).toBe(Result.STORYTELLER);
        expect(isPlayerMinion(mockGameState.players[0])).toBe(Result.STORYTELLER);
        expect(isPlayerWerewolf(mockGameState.players[0])).toBe(Result.STORYTELLER);

        expect(isPlayerOutsider(mockGameState.players[0])).toBe(Result.STORYTELLER);

        expect(isPlayerVillager(mockGameState.players[0])).toBe(Result.FALSE);
    });

});

describe('Saint', () => {

    // DEFEAT ON LYNCH
    test('Villager lose', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Saint');
        mockGameState.choppingBlock = { playerName: mockGameState.players[0].name, votes: 5 };

        const mockSetGameState = vi.fn();

        handleDusk(mockGameState, mockSetGameState);
        const updatedGameState =  mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.state).toBe(PlayState.DEFEAT);
    });

    test.each(['Poisoned'])('Villager lose fail (%s)', (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Saint');
        mockGameState.players[0].statuses.push(statuses[intoxication]);
        mockGameState.choppingBlock = { playerName: mockGameState.players[0].name, votes: 5 };

        const mockSetGameState = vi.fn();

        const updatedGameState = handleDusk(mockGameState, mockSetGameState);

        if (updatedGameState) {
            expect(updatedGameState.state).not.toBe(PlayState.DEFEAT);
        }
        else {
            fail('updatedGameState should not be null');
        }
    });

});

describe('Scarlet Woman', () => {

    // BECOME WEREWOLF
    test('Become Werewolf', () => {
        const mockGameState: GameState = defaultGameState(6, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Scarlet Woman');
        mockGameState.players[1].role = roles.find(r => r.name === 'Werewolf');

        const updatedGameState = killPlayerByIndex(1, mockGameState);

        expect(updatedGameState.players[1].alive).toBe(false);
        expect(updatedGameState.players[0].role?.name).toBe('Werewolf');
        expect(updatedGameState.players[0].alive).toBe(true);
    });

    test('Become Werewolf fail (Poisoned)', () => {
        const mockGameState: GameState = defaultGameState(6, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Scarlet Woman');
        mockGameState.players[0].statuses.push(statuses['Poisoned']);

        mockGameState.players[1].role = roles.find(r => r.name === 'Werewolf');

        const updatedGameState = killPlayerByIndex(1, mockGameState);

        expect(updatedGameState.players[1].alive).toBe(false);
        expect(updatedGameState.players[0].role?.name).not.toBe('Werewolf');
        expect(updatedGameState.players[0].alive).toBe(true);
    });

    test('Become Werewolf fail (too few alive)', () => {
        const mockGameState: GameState = defaultGameState(4, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Scarlet Woman');
        mockGameState.players[1].role = roles.find(r => r.name === 'Werewolf');

        const updatedGameState = killPlayerByIndex(1, mockGameState);

        expect(updatedGameState.players[1].alive).toBe(false);
        expect(updatedGameState.players[0].role?.name).not.toBe('Werewolf');
        expect(updatedGameState.players[0].alive).toBe(true);
    });

});


describe('Seer', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Soldier', () => {

    // ABILITY
    test('Werewolf kill immunity', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);
        mockGameState.players[0].role = roles.find(r => r.name === 'Soldier');

        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(0, mockGameState, [], vi.fn());

        expect(murder).toBe(false);
        expect(updatedGameState.players[0].alive).toBe(true);
        expect(temp).toBe('soldier');
    });

    test.each(intoxications)('Werewolf kill immunity fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);
        mockGameState.players[0].role = roles.find(r => r.name === 'Soldier');
        mockGameState.players[0].statuses.push(statuses[intoxication]);

        expect(mockGameState.players[0].alive).toBe(true);

        const [updatedGameState, murder, temp] = await handleNightKill(0, mockGameState, [], vi.fn());

        expect(murder).toBe(true);
        expect(updatedGameState.players[0].alive).toBe(false);
        expect(temp).toBe('soldier-null');
    });

});

describe('Spy', () => {

    // SOMETIMES PING AS GOOD
    test('Good ping', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Spy');

        expect(isPlayerEvil(mockGameState.players[0])).toBe(Result.STORYTELLER);
        expect(isPlayerMinion(mockGameState.players[0])).toBe(Result.STORYTELLER);

        expect(isPlayerVillager(mockGameState.players[0])).toBe(Result.STORYTELLER);
        expect(isPlayerOutsider(mockGameState.players[0])).toBe(Result.STORYTELLER);

        expect(isPlayerWerewolf(mockGameState.players[0])).toBe(Result.FALSE);
    });

    // CHECK ROLE
    test.skip('Check role', () => {
        // TODO
    });

});

describe('Undertaker', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Virgin', () => {

    // ABILITY
    test.skip('Ability', () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Virgin');
        mockGameState.players[1].role = roles.find(r => r.type === PlayerType.VILLAGER);

        expect(mockGameState.players[0].alive).toBe(true);
        expect(mockGameState.players[1].alive).toBe(true);

        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Washerwoman', () => {

    // ABILITY
    test.skip('Ability', () => {
        // TODO
    });

    test.each(intoxications)('Ability fail (%s)', (intoxication) => {
        // TODO
    });

});

describe('Werewolf', () => {

    // KILL ABILITY
    test('Werewolf kill', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);
        mockGameState.players[0].role = roles.find(r => r.name === 'Werewolf');
        mockGameState.players[1].statuses = [statuses['Targeted']];

        expect(mockGameState.players[1].alive).toBe(true);

        const updatedGameState = await handleDawn(mockGameState, vi.fn());

        expect(updatedGameState.players[1].alive).toBe(false);
    });

    test.each(intoxications)('Werewolf kill fail (%s)', async (intoxication) => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);
        mockGameState.players[0].role = roles.find(r => r.name === 'Werewolf');
        mockGameState.players[0].statuses.push(statuses[intoxication]);

        const status = {...statuses[intoxication]};
        status.drunk = intoxication === 'Drunk';
        status.poisoned = intoxication === 'Poisoned';
        mockGameState.players[1].statuses = [status];

        expect(mockGameState.players[1].alive).toBe(true);

        const updatedGameState = await handleDawn(mockGameState, vi.fn());

        expect(updatedGameState.players[1].alive).toBe(true);
    });

    // SELF-KILL ABILITY
    test('Self kill', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Werewolf');
        mockGameState.players[0].statuses = [statuses['Targeted']];

        mockGameState.players[1].role = roles.find(r => r.type === PlayerType.MINION);

        expect(mockGameState.players[0].alive).toBe(true);

        const updatedGameState = await handleDawn(mockGameState, vi.fn());

        expect(updatedGameState.players[0].alive).toBe(false);
        expect(updatedGameState.players[1].role?.name).toBe('Werewolf');
    });

    test('Self kill fail (no minion)', async () => {
        const mockGameState: GameState = defaultGameState(5, pseudonyms);

        mockGameState.players[0].role = roles.find(r => r.name === 'Werewolf');
        mockGameState.players[0].statuses = [statuses['Targeted']];

        expect(mockGameState.players[0].alive).toBe(true);

        const updatedGameState = await handleDawn(mockGameState, vi.fn());

        expect(updatedGameState.players[0].alive).toBe(false);
        expect(updatedGameState.players.filter(p => p.role?.name === 'Werewolf').length).toBe(1);
    });

});

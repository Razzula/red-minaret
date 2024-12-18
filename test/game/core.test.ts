import { test, describe, expect, vi } from 'vitest';

import { assignRoles } from '../../src/game/core';
import roles from '../../src/data/roles';

import { GameState } from '../../src/App';
import pseudonyms from '../../src/data/pseudonyms';
import { defaultGameState } from '../../src/game/utils';
import { PlayerType } from '../../src/enums';

describe('assignRoles', () => {
    const playerCounts = [5, 6];

    const villagerPool = [roles.findIndex(r => r.type === PlayerType.VILLAGER)];
    const outsiderPool = [roles.findIndex(r => r.type === PlayerType.OUTSIDER)];
    const werewolfPool = [roles.findIndex(r => r.type === PlayerType.WEREWOLF)];
    const minionPool = [roles.findIndex(r => r.type === PlayerType.MINION)];

    test.each(playerCounts)('correct roles for %i players', (numPlayers) => {
        const mockSetGameState = vi.fn();
        const mockGameState: GameState = defaultGameState(numPlayers, pseudonyms);

        expect(mockGameState.players.length).toBe(numPlayers);
        expect(mockGameState.players.every(p => p.role === undefined)).toBe(true);

        assignRoles(mockGameState, mockSetGameState, villagerPool, outsiderPool, werewolfPool, minionPool);

        const updatedGameState: GameState = mockSetGameState.mock.calls[0][0];

        expect(updatedGameState.players.filter(p => p.role?.type === PlayerType.WEREWOLF).length).toBe(1);
        expect(updatedGameState.players.filter(p => p.role?.type === PlayerType.MINION).length).toBe(numPlayers > 5 ? 1 : 0); // Minion for >=6 players
        expect(updatedGameState.players.filter(p => p.role?.type === PlayerType.VILLAGER).length).toBeGreaterThan(0);
        expect(updatedGameState.players.filter(p => p.role?.type === PlayerType.OUTSIDER).length).toBeGreaterThan(0);
    });
});

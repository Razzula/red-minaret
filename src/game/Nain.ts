import { Player } from "../App";

export function isPlayerGrandchild(player: Player) {
    return player.statuses?.find(status => status.name === 'Grandchild') !== undefined;
}

export function canNainSelectPlayer(player: Player | undefined, nainIsIntoxicated: boolean) {
    if (player === undefined) {
        return false;
    }

    if (nainIsIntoxicated) {
        return !isPlayerGrandchild(player);
    }
    else {
        return isPlayerGrandchild(player);
    }
}

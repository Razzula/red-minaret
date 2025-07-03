import React, { useEffect, useState } from 'react';

import { GameState, Player } from '../App';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip/Tooltip';
import { Role } from '../data/roles';
import CheckButton from './common/CheckButton/CheckButton';
import GridList from './common/GridList/GridList';
import { PlayerType, PlayerTypeType } from '../enums';
import IconButton from './common/IconButton/IconButton';
import { getActiveRoles, isPlayerDrunk, isPlayerIntoxicated, isPlayerPoisoned } from '../game/utils';
import { canNainSelectPlayer, isPlayerGrandchild } from '../game/Nain';

interface InvestigationProps {
    title?: string;
    players: Player[];
    possibleRoles: Role[];
    onInvestigate: (selectedRole: string, selectedPlayers: string[], count: number) => void;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const InvestigationInterface: React.FC<InvestigationProps> = ({ title, players, /*possibleRoles,*/ onInvestigate, setGameState }) => {

    const [roleFilter, setRoleFilter] = useState<PlayerTypeType>();
    const [roles, setRoles] = useState<Role[]>([]);
    const [relaventRole, setRelaventRole] = useState<Role>();
    const [investigator, setInvestigator] = useState<Player>();

    const [selectedRole, setSelectedRole] = useState<string>();
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

    const count = 1;

    const isInvestigatorIntoxicated = investigator ? isPlayerIntoxicated(investigator) : false;

    useEffect(() => {
        const activeRoles = getActiveRoles(players);
        if (roleFilter) {
            setRoles(
                activeRoles.filter((role) => role.type === roleFilter)
            );
        }
        else {
            setRoles(activeRoles);
        }
    }, [players, roleFilter]);

    useEffect(() => {
        const allRoles = players.flatMap((player) => (player.role ? [player.role] : []));
        if (title) {
            setRelaventRole(allRoles.find((role) => role.name === title));
        }
    }, [players, title]);

    useEffect(() => {
        switch (relaventRole?.name) {
            case 'Washerwoman':
                setRoleFilter(PlayerType.VILLAGER);
                break;
            case 'Librarian':
                setRoleFilter(PlayerType.OUTSIDER);
                break;
            case 'Investigator':
                setRoleFilter(PlayerType.MINION);
                break;
            default:
                setRoleFilter(undefined);
                break;
        }

        setInvestigator(players.find((p) => p.role?.name === relaventRole?.name));
    }, [relaventRole, players]);

    useEffect(() => {
        const mandatoryPlayer = getMandatoryPlayer();
        if (mandatoryPlayer && investigator) {
            if (isPlayerIntoxicated(investigator)) {
                setSelectedPlayers(prev => prev.filter((p) => p !== mandatoryPlayer.name));
            }
            else {
                if (!selectedPlayers.includes(mandatoryPlayer.name)) {
                    setSelectedPlayers([mandatoryPlayer.name]);
                }
            }
        }
    }, [selectedPlayers, players, selectedRole]);

    useEffect(() => {
        if (roles.length === 1) {
            setSelectedRole(roles[0].name);
        }
    }, [roles]);

    function getMandatoryPlayer() {
        // NAIN
        if (relaventRole?.name === 'Nain') {
            if (isInvestigatorIntoxicated) {
                return players.find((p) => isPlayerGrandchild(p));
            }
        }

        const player = players.find((p) => p.trueRole?.name === selectedRole);
        if (player) {
            return player;
        }
        return players.find((p) => p.role?.name === selectedRole);
    }

    function selectRole(role: string) {
        if (roles.length === 1) {
            return;
        }

        if (selectedRole === role) {
            setSelectedRole(undefined);
        }
        else {
            setSelectedRole(role);
        }
    }

    function selectPlayer(player: string) {
        if (selectedPlayers.includes(player)) {
            setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
        }
        else {
            setSelectedPlayers([...selectedPlayers, player]);
        }
    }

    function getRandomElement<T>(array: T[]): T {
        const randomIndex = Math.floor(Math.random() * array.length);
        return array[randomIndex];
    }

    function shufflePlayerSelection() {
        const mandatoryPlayer = players.find((p) => p.role?.name === selectedRole);
        if (mandatoryPlayer) {
            if (isInvestigatorIntoxicated) {
                setSelectedPlayers([
                    getRandomElement(players.filter(p => p.name !== mandatoryPlayer.name)).name,
                    getRandomElement(players.filter(p => p.name !== mandatoryPlayer.name)).name
                ]);
            }
            else {
                setSelectedPlayers([mandatoryPlayer.name, getRandomElement(players.filter(p => p.name !== mandatoryPlayer.name)).name]);
            }
        }
        else {
            const randomPlayer = getRandomElement(players).name;
            setSelectedPlayers([randomPlayer, getRandomElement(players.filter(p => p.name !== randomPlayer)).name]);
        }
    }

    function investigate(playersToSelect: number) {
        if (selectedRole && selectedPlayers.length === playersToSelect) {
            onInvestigate(selectedRole, selectedPlayers, count);
            setGameState((prev) => ({ ...prev, popupEvent: undefined }));
        }
    }

    const playersToSelect = relaventRole?.name === 'Nain' ? 1 : 2;

    return (
        <div className='dialogue-content'
            style={{
                padding: '20px',
            }}
        >
            <div className='column'>
                { title &&
                    <div className='dialogueHeading'>{title}</div>
                }

                { relaventRole?.night &&
                    <div style={{
                        margin: '5px 0px 20px 0px',
                        fontStyle: 'italic',
                    }}>{relaventRole.night}</div>
                }

                <div>
                    This role requires information to be chosen and given to the player. As the storyteller, this is your choice!
                </div>

                <div className='row'>
                    {/* ROLES */}
                    <GridList columns={3}>
                        {
                            roles.map((role, index) => {
                                const player = players.find((p) => p.role?.name === role.name);
                                return (
                                    <Tooltip key={index} placement='top'>
                                        <TooltipTrigger>
                                            <CheckButton
                                                key={index}
                                                image={`/red-minaret/icons/${role.icon}.png`} altText={role.name}
                                                isChecked={selectedRole === role.name}
                                                onChange={() => selectRole(role.name)}
                                                disabled={
                                                    relaventRole?.name === 'Nain' && !canNainSelectPlayer(player, isInvestigatorIntoxicated)
                                                }
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>{role.name}</TooltipContent>
                                    </Tooltip>
                                );
                            })
                        }

                        { roles.length > 1 && !(relaventRole?.name === 'Nain' && !isInvestigatorIntoxicated) &&
                            <IconButton
                                icon={<i className='ra ra-perspective-dice-one' />}
                                onClick={() => setSelectedRole(getRandomElement(roles).name)}
                                label='Random'
                            />
                        }
                    </GridList>

                    <hr style={{
                        width: '1px',
                        height: '100px',
                        backgroundColor: '#505050',
                        margin: '0 10px',
                    }}/>

                    {/* PLAYERS */}
                    <GridList columns={3}>
                        {
                            players.map((player, index) => {
                                const isMandatoryPlayer = getMandatoryPlayer()?.name === player.name;
                                return (
                                    <Tooltip key={index} placement='top'>
                                        <TooltipTrigger>
                                            <CheckButton
                                                key={index}
                                                image={`/red-minaret/characters/${player.name}.png`} altText={player.name}
                                                isChecked={selectedPlayers.includes(player.name)}
                                                onChange={() => selectPlayer(player.name)}
                                                styles={{
                                                    width: '50px',
                                                }}
                                                disabled={
                                                    relaventRole?.name === 'Nain' ? (
                                                        !canNainSelectPlayer(player, isInvestigatorIntoxicated)
                                                    ) : (
                                                        isInvestigatorIntoxicated && isMandatoryPlayer
                                                    )
                                                }
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>{player.name}</TooltipContent>
                                    </Tooltip>
                                );
                            })
                        }

                        { !(relaventRole?.name === 'Nain' && !isInvestigatorIntoxicated) &&
                            <IconButton
                                icon={<i className='ra ra-perspective-dice-one' />}
                                onClick={() => shufflePlayerSelection()}
                                label='Random'
                            />
                        }
                    </GridList>
                </div>

                <div>
                    "Out of {selectedPlayers.length ? selectedPlayers.join(' and ') : '...'}, <strong>{count}</strong> is the {selectedRole ?? '...'}."
                </div>

                <div className='alert'>
                    <ul>
                        { investigator && selectedPlayers.includes(investigator.name) &&
                            <li>Including the investigating player ({investigator.name}) is permitted, <i>although</i> it could be unfairly powerful.</li>
                        }
                    </ul>
                </div>

                <div className='storyteller'>
                    { investigator && isPlayerDrunk(investigator) &&
                        <li>{investigator.name} is drunk!</li>
                    }
                    { investigator && isPlayerPoisoned(investigator) &&
                        <li>{investigator.name} is poisoned!</li>
                    }
                </div>

                <IconButton
                    icon={<i className='ra ra-hourglass' />}
                    onClick={() => investigate(playersToSelect)}
                    disabled={!selectedRole || selectedPlayers.length !== playersToSelect}
                    label='Done'
                />

            </div>
        </div>
    );
};

export default InvestigationInterface;

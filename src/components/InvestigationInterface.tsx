import React, { useEffect, useState } from 'react';

import { GameState, Player } from '../App';
import { Tooltip, TooltipContent, TooltipTrigger } from './common/Tooltip/Tooltip';
import { Role } from '../data/roles';
import CheckButton from './common/CheckButton/CheckButton';
import GridList from './common/GridList/GridList';
import { PlayerType, PlayerTypeType } from '../enums';
import IconButton from './common/IconButton/IconButton';

interface InvestigationProps {
    title?: string;
    players: Player[];
    onInvestigate: (selectedRole: string, selectedPlayers: string[], count: number) => void;
    setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const InvestigationInterface: React.FC<InvestigationProps> = ({ title, players, onInvestigate, setGameState }) => {

    const [roleFilter, setRoleFilter] = useState<PlayerTypeType>();
    const [roles, setRoles] = useState<Role[]>([]);
    const [relaventRole, setRelaventRole] = useState<Role>();

    const [selectedRole, setSelectedRole] = useState<string>();
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

    const count = 1;

    useEffect(() => {
        const definedRoles = players.flatMap((player) => (player.role ? [player.role] : []));
        if (roleFilter) {
            setRoles(
                definedRoles.filter((role) => role.type === roleFilter)
            );
        }
        else {
            setRoles(definedRoles);
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
    }, [relaventRole]);

    useEffect(() => {
        const mandatoryPlayer = players.find((p) => p.role?.name === selectedRole);
        if (mandatoryPlayer) {
            if (!selectedPlayers.includes(mandatoryPlayer.name)) {
                setSelectedPlayers([mandatoryPlayer.name]);
            }
        }
    }, [selectedPlayers, players, selectedRole]);

    useEffect(() => {
        if (roles.length === 1) {
            setSelectedRole(roles[0].name);
        }
    }, [roles]);

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
            setSelectedPlayers([mandatoryPlayer.name, getRandomElement(players.filter(p => p.name !== mandatoryPlayer.name)).name]);
        }
        else {
            const randomPlayer = getRandomElement(players).name;
            setSelectedPlayers([randomPlayer, getRandomElement(players.filter(p => p.name !== randomPlayer)).name]);
        }
    }

    function investigate() {
        if (selectedRole && selectedPlayers.length === 2) {
            onInvestigate(selectedRole, selectedPlayers, count);
            setGameState((prev) => ({ ...prev, popupEvent: undefined }));
        }
    }

    const investigator = players.find((p) => p.role?.name === relaventRole?.name)?.name;

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
                            roles.map((role, index) => (
                                <Tooltip key={index} placement='top'>
                                    <TooltipTrigger>
                                        <CheckButton
                                            key={index}
                                            image={`/red-minaret/icons/${role.icon}.png`} altText={role.name}
                                            isChecked={selectedRole === role.name}
                                            onChange={() => selectRole(role.name)}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>{role.name}</TooltipContent>
                                </Tooltip>
                            ))
                        }

                        { roles.length > 1 &&
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
                            players.map((player, index) => (
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
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>{player.name}</TooltipContent>
                                </Tooltip>
                            ))
                        }

                        <IconButton
                            icon={<i className='ra ra-perspective-dice-one' />}
                            onClick={() => shufflePlayerSelection()}
                            label='Random'
                        />
                    </GridList>
                </div>

                <div>
                    "Out of {selectedPlayers.length ? selectedPlayers.join(' and ') : '...'}, <strong>{count}</strong> is the {selectedRole ?? '...'}."
                </div>

                <div className='alert'>
                    <ul>
                        { investigator && selectedPlayers.includes(investigator) &&
                            <li>Including the investigating player ({investigator}) is permitted, <i>although</i> it could be unfairly powerful.</li>
                        }
                    </ul>
                </div>

                <IconButton
                    icon={<i className='ra ra-hourglass' />}
                    onClick={() => investigate()}
                    disabled={!selectedRole || selectedPlayers.length !== 2}
                    label='Done'
                />

            </div>
        </div>
    );
};

export default InvestigationInterface;
